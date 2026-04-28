import React from "react";
import { Modal, Button, Tag, Divider } from "antd";

interface AnswerState {
  [questionId: number]: {
    answer: string;
    answered: boolean;
    marked: boolean;
  };
}

interface SubmitModalProps {
  visible: boolean;
  answers: AnswerState;
  totalCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({
  visible,
  answers,
  totalCount,
  onCancel,
  onConfirm,
}) => {
  const answeredCount = Object.values(answers).filter((a) => a.answered).length;
  const markedCount = Object.values(answers).filter((a) => a.marked).length;

  return (
    <Modal
      title="确认交卷"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={onConfirm}>
          确认交卷
        </Button>,
      ]}
    >
      <div>
        <p>
          已答题数: <Tag color="green">{answeredCount}</Tag>
        </p>
        <p>
          未答题数: <Tag color="orange">{totalCount - answeredCount}</Tag>
        </p>
        <p>
          标记题数: <Tag color="blue">{markedCount}</Tag>
        </p>
        <Divider />
        <p>确定要交卷吗？交卷后将无法继续作答。</p>
      </div>
    </Modal>
  );
};
