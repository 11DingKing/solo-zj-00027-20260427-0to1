import React from "react";
import {
  Card,
  Tag,
  Typography,
  Space,
  Divider,
  Radio,
  Checkbox,
  Input,
} from "antd";
import { QuestionType, ExamQuestion, DifficultyLevel } from "@/types";
import {
  formatQuestionType,
  formatDifficulty,
  getDifficultyColor,
  shuffleArray,
} from "@/utils/format";

const { Text } = Typography;
const { TextArea } = Input;

interface AnswerState {
  [questionId: number]: {
    answer: string;
    answered: boolean;
    marked: boolean;
  };
}

interface QuestionRendererProps {
  examQuestion: ExamQuestion;
  currentIndex: number;
  shuffleOptions: boolean;
  answer: { answer: string; answered: boolean; marked: boolean };
  onAnswerChange: (questionId: number, answer: string) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  examQuestion,
  currentIndex,
  shuffleOptions,
  answer,
  onAnswerChange,
}) => {
  const question = examQuestion.question;

  const renderOptions = () => {
    let options = [...question.options];

    if (shuffleOptions) {
      options = shuffleArray(options);
    }

    switch (question.type) {
      case QuestionType.SINGLE_CHOICE:
        return (
          <Radio.Group
            value={answer.answer}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
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
        const selectedValues = answer.answer
          ? JSON.parse(answer.answer || "[]")
          : [];
        return (
          <Checkbox.Group
            value={selectedValues}
            onChange={(values) =>
              onAnswerChange(question.id, JSON.stringify(values))
            }
          >
            <Space direction="vertical" style={{ width: "100%" }}>
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
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
          >
            <Space>
              <div className="option-item" style={{ display: "inline-block" }}>
                <Radio value="true">正确</Radio>
              </div>
              <div className="option-item" style={{ display: "inline-block" }}>
                <Radio value="false">错误</Radio>
              </div>
            </Space>
          </Radio.Group>
        );

      case QuestionType.FILL_BLANK:
        return (
          <TextArea
            value={answer.answer}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            placeholder="请输入答案"
            rows={3}
            className="fill-blank-input"
            style={{ width: "100%" }}
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
                <Tag key={tag} color="cyan">
                  {tag}
                </Tag>
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
