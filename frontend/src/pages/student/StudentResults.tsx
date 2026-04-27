import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  message,
  Spin,
  Button,
  Modal,
  Empty,
  Divider
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { apiService } from '@/services/api';
import { ExamResult, ExamAnswer, Question, QuestionType } from '@/types';
import { formatDateTime, formatQuestionType, parseCorrectAnswer } from '@/utils/format';

const { Title, Text } = Typography;

const StudentResults: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const result = await apiService.getExamResults();
      setResults(result);
    } catch (error) {
      message.error('获取成绩列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (result: ExamResult) => {
    setSelectedResult(result);
    setDetailModalVisible(true);
    setDetailLoading(true);
    try {
      const answersData = await apiService.getAnswersForGrading(result.examSessionId);
      setAnswers(answersData);
    } catch (error) {
      message.error('获取答卷详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ColumnsType<ExamResult> = [
    {
      title: '考试名称',
      dataIndex: ['examPaper', 'name'],
      key: 'examName'
    },
    {
      title: '自动得分',
      dataIndex: 'autoScore',
      key: 'autoScore',
      render: (score: number) => `${score}分`
    },
    {
      title: '教师加分',
      dataIndex: 'teacherScore',
      key: 'teacherScore',
      render: (score?: number) => score !== undefined ? `${score}分` : <Text type="secondary">待批改</Text>
    },
    {
      title: '总分',
      key: 'totalScore',
      render: (_, record) => (
        <Tag color={record.isPassed ? 'green' : 'red'}>
          {record.totalScore}分
        </Tag>
      )
    },
    {
      title: '是否及格',
      dataIndex: 'isPassed',
      key: 'isPassed',
      render: (isPassed: boolean) => (
        <Tag color={isPassed ? 'green' : 'red'}>
          {isPassed ? '及格' : '不及格'}
        </Tag>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (time: string) => formatDateTime(time)
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      )
    }
  ];

  const renderAnswerDetail = (answer: ExamAnswer, index: number) => {
    const question = answers[index]?.['question'] as Question | undefined;
    if (!question) return null;

    const isAutoGraded = question.type !== QuestionType.FILL_BLANK;
    const correctAnswers = parseCorrectAnswer(question.type, question.correctAnswer);
    const isCorrect = answer.isCorrect;

    return (
      <Card
        key={answer.id}
        className={`answer-detail-card ${isCorrect ? 'correct' : isAutoGraded ? 'wrong' : 'pending'}`}
        style={{ marginBottom: 16 }}
        size="small"
      >
        <div style={{ marginBottom: 12 }}>
          <Space>
            <Tag>{formatQuestionType(question.type)}</Tag>
            <Tag>{question.score}分</Tag>
            {isAutoGraded ? (
              <Tag color={isCorrect ? 'green' : 'red'}>
                {isCorrect ? '正确' : '错误'}
              </Tag>
            ) : (
              <Tag color="orange">
                {answer.teacherScore !== undefined ? '已批改' : '待批改'}
              </Tag>
            )}
            {answer.teacherScore !== undefined && (
              <Tag color="blue">教师给分: {answer.teacherScore}分</Tag>
            )}
          </Space>
        </div>

        <div style={{ marginBottom: 8 }}>
          <Text strong>第 {index + 1} 题. </Text>
          <Text>{question.content}</Text>
        </div>

        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="题目图片"
            style={{ maxWidth: '100%', marginBottom: 8, borderRadius: 4 }}
          />
        )}

        {question.options && question.options.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {question.options.map((opt, idx) => {
              const optionLetter = String.fromCharCode(65 + idx);
              const isStudentSelected = (
                question.type === QuestionType.SINGLE_CHOICE
                  ? answer.studentAnswer === String(opt.id)
                  : question.type === QuestionType.MULTIPLE_CHOICE
                  ? (() => {
                      try {
                        const selected = JSON.parse(answer.studentAnswer || '[]');
                        return Array.isArray(selected) && selected.includes(String(opt.id));
                      } catch {
                        return false;
                      }
                    })()
                  : false
              );

              const isOptionCorrect = opt.isCorrect || (
                question.type === QuestionType.SINGLE_CHOICE
                  ? String(opt.id) === question.correctAnswer
                  : question.type === QuestionType.MULTIPLE_CHOICE
                  ? (() => {
                      try {
                        const correct = JSON.parse(question.correctAnswer);
                        return Array.isArray(correct) && correct.includes(String(opt.id));
                      } catch {
                        return false;
                      }
                    })()
                  : false
              );

              let optionClass = '';
              if (isStudentSelected && isOptionCorrect) {
                optionClass = 'correct';
              } else if (isStudentSelected && !isOptionCorrect) {
                optionClass = 'wrong';
              } else if (!isStudentSelected && isOptionCorrect) {
                optionClass = 'correct';
              }

              return (
                <div
                  key={opt.id}
                  className={`option-item ${optionClass}`}
                  style={{ padding: '8px 12px', marginBottom: 4 }}
                >
                  <Text strong>{optionLetter}. </Text>
                  {opt.text}
                  {isOptionCorrect && <Tag color="green" style={{ marginLeft: 8 }}>正确答案</Tag>}
                </div>
              );
            })}
          </div>
        )}

        {question.type === QuestionType.TRUE_FALSE && (
          <div style={{ marginBottom: 12 }}>
            <Text>学生答案: </Text>
            <Tag color={isCorrect ? 'green' : 'red'}>
              {answer.studentAnswer === '1' ? '正确' : answer.studentAnswer === '2' ? '错误' : '未作答'}
            </Tag>
            <Text style={{ marginLeft: 16 }}>正确答案: </Text>
            <Tag color="green">
              {question.correctAnswer === '1' ? '正确' : '错误'}
            </Tag>
          </div>
        )}

        {question.type === QuestionType.FILL_BLANK && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>
              <Text strong>学生答案: </Text>
              <Text>{answer.studentAnswer || '(未作答)'}</Text>
            </div>
            <div style={{ marginBottom: 4 }}>
              <Text strong>正确答案: </Text>
              <Text>{correctAnswers.join(', ')}</Text>
            </div>
            {answer.teacherComment && (
              <div style={{ marginBottom: 4 }}>
                <Text strong type="secondary">教师批注: </Text>
                <Text type="secondary">{answer.teacherComment}</Text>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      <Card>
        <Title level={4} style={{ marginBottom: 24 }}>我的成绩</Title>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <Spin size="large" />
          </div>
        ) : results.length === 0 ? (
          <Empty description="暂无考试成绩" />
        ) : (
          <Table
            columns={columns}
            dataSource={results}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条`
            }}
          />
        )}
      </Card>

      <Modal
        title="答卷详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedResult && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <Text strong>考试: </Text>
                  <Text>{selectedResult.examPaper?.name}</Text>
                </div>
                <div>
                  <Text strong>总分: </Text>
                  <Tag color={selectedResult.isPassed ? 'green' : 'red'}>
                    {selectedResult.totalScore}分
                  </Tag>
                </div>
                <div>
                  <Text strong>状态: </Text>
                  <Tag color={selectedResult.isPassed ? 'green' : 'red'}>
                    {selectedResult.isPassed ? '及格' : '不及格'}
                  </Tag>
                </div>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <Text strong>自动得分: </Text>
                  <Text>{selectedResult.autoScore}分</Text>
                </div>
                {selectedResult.teacherScore !== undefined && (
                  <div>
                    <Text strong>教师加分: </Text>
                    <Text>{selectedResult.teacherScore}分</Text>
                  </div>
                )}
                <div>
                  <Text strong>提交时间: </Text>
                  <Text>{formatDateTime(selectedResult.submittedAt)}</Text>
                </div>
              </div>
            </Card>

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : (
              <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                {answers.map((answer, index) => renderAnswerDetail(answer, index))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentResults;
