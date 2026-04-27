import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Tag,
  Typography,
  Space,
  Modal,
  message,
  Spin,
  Radio,
  Checkbox,
  Input,
  Row,
  Col,
  Divider,
  Statistic
} from 'antd';
import {
  FlagOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SafetyOutlined
} from '@ant-design/icons';

import { apiService } from '@/services/api';
import {
  ExamSession,
  ExamPaper,
  ExamQuestion,
  QuestionType,
  Question,
  ExamAnswer
} from '@/types';
import { formatQuestionType, formatDifficulty, getDifficultyColor, formatCountdown, shuffleArray } from '@/utils/format';
import { useExamAntiCheat } from '@/hooks/useExamAntiCheat';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AnswerState {
  [questionId: number]: {
    answer: string;
    answered: boolean;
    marked: boolean;
  };
}

const ExamPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [examPaper, setExamPaper] = useState<ExamPaper | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [cheatingMessage, setCheatingMessage] = useState('');

  useEffect(() => {
    if (sessionId) {
      fetchSession(parseInt(sessionId));
    }
  }, [sessionId]);

  const fetchSession = async (id: number) => {
    setLoading(true);
    try {
      const sessionData = await apiService.getExamSession(id);
      setSession(sessionData);
      setExamPaper(sessionData.examPaper);
      
      let questions = [...sessionData.examPaper.examQuestions];
      
      if (sessionData.examPaper.shuffleQuestions) {
        questions = shuffleArray(questions);
      }
      
      setExamQuestions(questions);
      
      const durationSeconds = sessionData.examPaper.duration * 60;
      const startTime = new Date(sessionData.startTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);
      
      setTimeRemaining(remaining);
      
      const initialAnswers: AnswerState = {};
      questions.forEach((eq) => {
        initialAnswers[eq.questionId] = {
          answer: '',
          answered: false,
          marked: false
        };
      });
      setAnswers(initialAnswers);
      
      const savedAnswers = await apiService.getAnswers(id);
      savedAnswers.forEach((answer) => {
        initialAnswers[answer.questionId] = {
          answer: answer.studentAnswer,
          answered: true,
          marked: false
        };
      });
      setAnswers({ ...initialAnswers });
      
    } catch (error) {
      message.error('加载考试数据失败');
      navigate('/student/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleWarning = useCallback(() => {
    setCheatingMessage('检测到切屏操作，请注意考试纪律！');
    setWarningModalVisible(true);
  }, []);

  const handleMaxViolation = useCallback(() => {
    setCheatingMessage('切屏次数已达上限，系统将自动提交试卷。');
    setSubmitModalVisible(true);
    Modal.confirm({
      title: '考试纪律警告',
      icon: <ExclamationCircleOutlined />,
      content: '切屏次数已超过限制，系统将自动提交您的试卷。',
      okText: '确认提交',
      cancelText: '取消',
      onOk: () => handleSubmit(),
      onCancel: () => setSubmitModalVisible(false)
    });
  }, []);

  const { screenSwitchCount, maxScreenSwitches } = useExamAntiCheat({
    sessionId: parseInt(sessionId || '0'),
    onWarning: handleWarning,
    onMaxViolation: handleMaxViolation
  });

  useEffect(() => {
    if (loading || !session || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, session]);

  const submitAnswer = async (questionId: number, answer: string) => {
    if (!sessionId) return;
    try {
      await apiService.submitAnswer(parseInt(sessionId), questionId, answer);
    } catch (error) {
      console.error('提交答案失败:', error);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
        answered: answer.trim() !== ''
      }
    }));
    submitAnswer(questionId, answer);
  };

  const handleToggleMark = (questionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        marked: !prev[questionId]?.marked
      }
    }));
  };

  const handleSubmit = async () => {
    if (!sessionId) return;
    
    const unansweredCount = Object.values(answers).filter(a => !a.answered).length;
    if (unansweredCount > 0) {
      Modal.confirm({
        title: '确认提交',
        icon: <ExclamationCircleOutlined />,
        content: `您还有 ${unansweredCount} 道题未作答，确定要提交吗？`,
        okText: '确认提交',
        cancelText: '继续作答',
        onOk: async () => {
          try {
            const result = await apiService.submitExam(parseInt(sessionId));
            message.success('提交成功！');
            navigate('/student/results');
          } catch (error) {
            message.error('提交失败');
          }
        }
      });
    } else {
      Modal.confirm({
        title: '确认提交',
        icon: <CheckCircleOutlined />,
        content: '确定要提交试卷吗？',
        okText: '确认提交',
        cancelText: '继续作答',
        onOk: async () => {
          try {
            await apiService.submitExam(parseInt(sessionId));
            message.success('提交成功！');
            navigate('/student/results');
          } catch (error) {
            message.error('提交失败');
          }
        }
      });
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const getQuestionStatus = (index: number) => {
    const eq = examQuestions[index];
    if (!eq) return 'unanswered';
    
    const answer = answers[eq.questionId];
    if (answer?.marked) return 'marked';
    if (answer?.answered) return 'answered';
    return 'unanswered';
  };

  const renderQuestion = (eq: ExamQuestion) => {
    const question = eq.question;
    const answer = answers[question.id] || { answer: '', answered: false, marked: false };

    const renderOptions = () => {
      let options = [...question.options];
      
      if (examPaper?.shuffleOptions) {
        options = shuffleArray(options);
      }

      switch (question.type) {
        case QuestionType.SINGLE_CHOICE:
          return (
            <Radio.Group
              value={answer.answer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {options.map((opt, idx) => (
                  <div key={opt.id} className="option-item">
                    <Radio value={String(opt.id)}>
                      <Text strong>{String.fromCharCode(65 + idx)}. </Text>
                      {opt.text}
                    </Radio>
                  </div>
                ))}
              </Space>
            </Radio.Group>
          );

        case QuestionType.MULTIPLE_CHOICE:
          const selectedValues = answer.answer ? JSON.parse(answer.answer || '[]') : [];
          return (
            <Checkbox.Group
              value={selectedValues}
              onChange={(values) => handleAnswerChange(question.id, JSON.stringify(values))}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {options.map((opt, idx) => (
                  <div key={opt.id} className="option-item">
                    <Checkbox value={String(opt.id)}>
                      <Text strong>{String.fromCharCode(65 + idx)}. </Text>
                      {opt.text}
                    </Checkbox>
                  </div>
                ))}
              </Space>
            </Checkbox.Group>
          );

        case QuestionType.TRUE_FALSE:
          return (
            <Radio.Group
              value={answer.answer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            >
              <Space>
                <div className="option-item" style={{ display: 'inline-block' }}>
                  <Radio value="1">正确</Radio>
                </div>
                <div className="option-item" style={{ display: 'inline-block' }}>
                  <Radio value="2">错误</Radio>
                </div>
              </Space>
            </Radio.Group>
          );

        case QuestionType.FILL_BLANK:
          return (
            <TextArea
              value={answer.answer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="请输入答案"
              rows={3}
              className="fill-blank-input"
              style={{ width: '100%' }}
            />
          );

        default:
          return null;
      }
    };

    return (
      <div key={question.id} className="question-card">
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Tag>{formatQuestionType(question.type)}</Tag>
              <Tag color={getDifficultyColor(question.difficulty)}>
                {formatDifficulty(question.difficulty)}
              </Tag>
              <Tag>{question.score}分</Tag>
            </Space>
          </div>

          <div className="question-content">
            <Text strong>第 {currentIndex + 1} 题. </Text>
            {question.content}
          </div>

          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt="题目图片"
              className="question-image"
            />
          )}

          {question.tags && question.tags.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                {question.tags.map((tag) => (
                  <Tag key={tag} color="cyan">{tag}</Tag>
                ))}
              </Space>
            </div>
          )}

          <Divider />

          {renderOptions()}
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const currentQuestion = examQuestions[currentIndex];
  const answeredCount = Object.values(answers).filter(a => a.answered).length;
  const totalCount = examQuestions.length;

  return (
    <div className="exam-container">
      <div className="countdown-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={4} style={{ margin: 0 }}>{examPaper?.name}</Title>
          <Tag icon={<SafetyOutlined />} color={screenSwitchCount > 0 ? 'orange' : 'green'}>
            切屏次数: {screenSwitchCount}/{maxScreenSwitches}
          </Tag>
        </div>
        
        <Space>
          <Statistic
            value={formatCountdown(timeRemaining)}
            valueStyle={{
              color: timeRemaining < 300 ? '#ff4d4f' : '#1890ff',
              fontSize: 24,
              fontWeight: 'bold'
            }}
            prefix={<ClockCircleOutlined />}
          />
          <Button type="primary" onClick={() => setSubmitModalVisible(true)}>
            交卷
          </Button>
        </Space>
      </div>

      <div style={{ flex: 1, display: 'flex', marginTop: 64 }}>
        <div className="exam-sidebar">
          <div style={{ marginBottom: 16 }}>
            <Text strong>答题进度: {answeredCount}/{totalCount}</Text>
          </div>
          
          <div className="question-nav-grid">
            {examQuestions.map((_, index) => {
              const status = getQuestionStatus(index);
              const isCurrent = index === currentIndex;
              return (
                <div
                  key={index}
                  className={`question-nav-item ${status} ${isCurrent ? 'current' : ''}`}
                  onClick={() => goToQuestion(index)}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>

          <Divider />

          <div>
            <Space direction="vertical" size="small">
              <Space>
                <div className="question-nav-item unanswered" style={{ width: 20, height: 20 }} />
                <Text type="secondary">未答</Text>
              </Space>
              <Space>
                <div className="question-nav-item answered" style={{ width: 20, height: 20 }} />
                <Text type="secondary">已答</Text>
              </Space>
              <Space>
                <div className="question-nav-item marked" style={{ width: 20, height: 20 }} />
                <Text type="secondary">标记</Text>
              </Space>
            </Space>
          </div>
        </div>

        <div className="exam-main">
          {currentQuestion && renderQuestion(currentQuestion)}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <Button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              上一题
            </Button>
            
            <Button
              icon={<FlagOutlined />}
              onClick={() => currentQuestion && handleToggleMark(currentQuestion.questionId)}
              type={answers[currentQuestion?.questionId]?.marked ? 'primary' : 'default'}
            >
              {answers[currentQuestion?.questionId]?.marked ? '取消标记' : '标记此题'}
            </Button>
            
            {currentIndex === examQuestions.length - 1 ? (
              <Button type="primary" onClick={() => setSubmitModalVisible(true)}>
                交卷
              </Button>
            ) : (
              <Button type="primary" onClick={goToNext}>
                下一题
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal
        title="确认交卷"
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSubmitModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            确认交卷
          </Button>
        ]}
      >
        <div>
          <p>已答题数: <Tag color="green">{answeredCount}</Tag></p>
          <p>未答题数: <Tag color="orange">{totalCount - answeredCount}</Tag></p>
          <p>标记题数: <Tag color="blue">{Object.values(answers).filter(a => a.marked).length}</Tag></p>
          <Divider />
          <p>确定要交卷吗？交卷后将无法继续作答。</p>
        </div>
      </Modal>

      <Modal
        title="考试纪律警告"
        open={warningModalVisible}
        onOk={() => setWarningModalVisible(false)}
        onCancel={() => setWarningModalVisible(false)}
      >
        <p>{cheatingMessage}</p>
        <p>当前切屏次数: {screenSwitchCount}/{maxScreenSwitches}</p>
        <p>切屏次数超过 {maxScreenSwitches} 次将自动提交试卷。</p>
      </Modal>
    </div>
  );
};

export default ExamPage;
