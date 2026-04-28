import React from "react";
import { Button } from "antd";
import { FlagOutlined } from "@ant-design/icons";

interface ExamNavigationProps {
  currentIndex: number;
  totalCount: number;
  isMarked: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleMark: () => void;
  onSubmit: () => void;
}

export const ExamNavigation: React.FC<ExamNavigationProps> = ({
  currentIndex,
  totalCount,
  isMarked,
  onPrevious,
  onNext,
  onToggleMark,
  onSubmit,
}) => {
  const isLastQuestion = currentIndex === totalCount - 1;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 24,
      }}
    >
      <Button onClick={onPrevious} disabled={currentIndex === 0}>
        上一题
      </Button>

      <Button
        icon={<FlagOutlined />}
        onClick={onToggleMark}
        type={isMarked ? "primary" : "default"}
      >
        {isMarked ? "取消标记" : "标记此题"}
      </Button>

      {isLastQuestion ? (
        <Button type="primary" onClick={onSubmit}>
          交卷
        </Button>
      ) : (
        <Button type="primary" onClick={onNext}>
          下一题
        </Button>
      )}
    </div>
  );
};
