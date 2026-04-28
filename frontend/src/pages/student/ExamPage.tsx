import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Modal, message, Spin } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import { apiService } from "@/services/api";
import { ExamSession, ExamQuestion } from "@/types";
import { shuffleArray } from "@/utils/format";
import { useExamAntiCheat } from "@/hooks/useExamAntiCheat";
import {
  ExamHeader,
  QuestionNav,
  QuestionRenderer,
  SubmitModal,
  WarningModal,
  ExamNavigation,
} from "@/components";

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
  const [examPaper, setExamPaper] = useState<{
    name: string;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    duration: number;
  } | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [cheatingMessage, setCheatingMessage] = useState("");

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
      const paper = sessionData.examPaper;
      setExamPaper({
        name: paper.name,
        shuffleQuestions: paper.shuffleQuestions,
        shuffleOptions: paper.shuffleOptions,
        duration: paper.duration,
      });

      let questions = [...paper.examQuestions];

      if (paper.shuffleQuestions) {
        questions = shuffleArray(questions);
      }

      setExamQuestions(questions);

      const durationSeconds = paper.duration * 60;
      const startTime = new Date(sessionData.startTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);

      setTimeRemaining(remaining);

      const initialAnswers: AnswerState = {};
      questions.forEach((eq) => {
        initialAnswers[eq.questionId] = {
          answer: "",
          answered: false,
          marked: false,
        };
      });
      setAnswers(initialAnswers);

      const savedAnswers = await apiService.getAnswers(id);
      savedAnswers.forEach((answer) => {
        initialAnswers[answer.questionId] = {
          answer: answer.studentAnswer,
          answered: true,
          marked: false,
        };
      });
      setAnswers({ ...initialAnswers });
    } catch (error) {
      message.error("加载考试数据失败");
      navigate("/student/exams");
    } finally {
      setLoading(false);
    }
  };

  const handleWarning = useCallback(() => {
    setCheatingMessage("检测到切屏操作，请注意考试纪律！");
    setWarningModalVisible(true);
  }, []);

  const handleMaxViolation = useCallback(() => {
    setCheatingMessage("切屏次数已达上限，系统将自动提交试卷。");
    Modal.confirm({
      title: "考试纪律警告",
      icon: <ExclamationCircleOutlined />,
      content: "切屏次数已超过限制，系统将自动提交您的试卷。",
      okText: "确认提交",
      cancelText: "取消",
      onOk: () => handleSubmit(),
      onCancel: () => setSubmitModalVisible(false),
    });
  }, []);

  const { screenSwitchCount, maxScreenSwitches } = useExamAntiCheat({
    sessionId: parseInt(sessionId || "0"),
    onWarning: handleWarning,
    onMaxViolation: handleMaxViolation,
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
      console.error("提交答案失败:", error);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
        answered: answer.trim() !== "",
      },
    }));
    submitAnswer(questionId, answer);
  };

  const handleToggleMark = (questionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        marked: !prev[questionId]?.marked,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!sessionId) return;

    const unansweredCount = Object.values(answers).filter(
      (a) => !a.answered,
    ).length;
    if (unansweredCount > 0) {
      Modal.confirm({
        title: "确认提交",
        icon: <ExclamationCircleOutlined />,
        content: `您还有 ${unansweredCount} 道题未作答，确定要提交吗？`,
        okText: "确认提交",
        cancelText: "继续作答",
        onOk: async () => {
          try {
            await apiService.submitExam(parseInt(sessionId));
            message.success("提交成功！");
            navigate("/student/results");
          } catch (error) {
            message.error("提交失败");
          }
        },
      });
    } else {
      Modal.confirm({
        title: "确认提交",
        icon: <CheckCircleOutlined />,
        content: "确定要提交试卷吗？",
        okText: "确认提交",
        cancelText: "继续作答",
        onOk: async () => {
          try {
            await apiService.submitExam(parseInt(sessionId));
            message.success("提交成功！");
            navigate("/student/results");
          } catch (error) {
            message.error("提交失败");
          }
        },
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

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const currentQuestion = examQuestions[currentIndex];

  return (
    <div className="exam-container">
      <ExamHeader
        examName={examPaper?.name || ""}
        timeRemaining={timeRemaining}
        screenSwitchCount={screenSwitchCount}
        maxScreenSwitches={maxScreenSwitches}
        onSubmit={() => setSubmitModalVisible(true)}
      />

      <div style={{ flex: 1, display: "flex", marginTop: 64 }}>
        <QuestionNav
          examQuestions={examQuestions}
          currentIndex={currentIndex}
          answers={answers}
          onGoToQuestion={goToQuestion}
        />

        <div className="exam-main">
          {currentQuestion && (
            <QuestionRenderer
              examQuestion={currentQuestion}
              currentIndex={currentIndex}
              shuffleOptions={examPaper?.shuffleOptions || false}
              answer={
                answers[currentQuestion.questionId] || {
                  answer: "",
                  answered: false,
                  marked: false,
                }
              }
              onAnswerChange={handleAnswerChange}
            />
          )}

          {currentQuestion && (
            <ExamNavigation
              currentIndex={currentIndex}
              totalCount={examQuestions.length}
              isMarked={answers[currentQuestion.questionId]?.marked || false}
              onPrevious={goToPrevious}
              onNext={goToNext}
              onToggleMark={() => handleToggleMark(currentQuestion.questionId)}
              onSubmit={() => setSubmitModalVisible(true)}
            />
          )}
        </div>
      </div>

      <SubmitModal
        visible={submitModalVisible}
        answers={answers}
        totalCount={examQuestions.length}
        onCancel={() => setSubmitModalVisible(false)}
        onConfirm={handleSubmit}
      />

      <WarningModal
        visible={warningModalVisible}
        message={cheatingMessage}
        screenSwitchCount={screenSwitchCount}
        maxScreenSwitches={maxScreenSwitches}
        onClose={() => setWarningModalVisible(false)}
      />
    </div>
  );
};

export default ExamPage;
