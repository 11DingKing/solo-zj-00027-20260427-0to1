import React from "react";
import { Typography, Divider, Space } from "antd";
import { ExamQuestion } from "@/types";

const { Text } = Typography;

interface AnswerState {
  [questionId: number]: {
    answer: string;
    answered: boolean;
    marked: boolean;
  };
}

interface QuestionNavProps {
  examQuestions: ExamQuestion[];
  currentIndex: number;
  answers: AnswerState;
  onGoToQuestion: (index: number) => void;
}

export const QuestionNav: React.FC<QuestionNavProps> = ({
  examQuestions,
  currentIndex,
  answers,
  onGoToQuestion,
}) => {
  const answeredCount = Object.values(answers).filter((a) => a.answered).length;
  const totalCount = examQuestions.length;

  const getQuestionStatus = (
    index: number,
  ): "unanswered" | "answered" | "marked" => {
    const eq = examQuestions[index];
    if (!eq) return "unanswered";

    const answer = answers[eq.questionId];
    if (answer?.marked) return "marked";
    if (answer?.answered) return "answered";
    return "unanswered";
  };

  return (
    <div className="exam-sidebar">
      <div style={{ marginBottom: 16 }}>
        <Text strong>
          答题进度: {answeredCount}/{totalCount}
        </Text>
      </div>

      <div className="question-nav-grid">
        {examQuestions.map((_, index) => {
          const status = getQuestionStatus(index);
          const isCurrent = index === currentIndex;
          return (
            <div
              key={index}
              className={`question-nav-item ${status} ${isCurrent ? "current" : ""}`}
              onClick={() => onGoToQuestion(index)}
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
            <div
              className="question-nav-item unanswered"
              style={{ width: 20, height: 20 }}
            />
            <Text type="secondary">未答</Text>
          </Space>
          <Space>
            <div
              className="question-nav-item answered"
              style={{ width: 20, height: 20 }}
            />
            <Text type="secondary">已答</Text>
          </Space>
          <Space>
            <div
              className="question-nav-item marked"
              style={{ width: 20, height: 20 }}
            />
            <Text type="secondary">标记</Text>
          </Space>
        </Space>
      </div>
    </div>
  );
};
