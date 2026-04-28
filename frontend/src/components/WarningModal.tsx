import React from "react";
import { Modal } from "antd";

interface WarningModalProps {
  visible: boolean;
  message: string;
  screenSwitchCount: number;
  maxScreenSwitches: number;
  onClose: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  visible,
  message,
  screenSwitchCount,
  maxScreenSwitches,
  onClose,
}) => {
  return (
    <Modal
      title="考试纪律警告"
      open={visible}
      onOk={onClose}
      onCancel={onClose}
    >
      <p>{message}</p>
      <p>
        当前切屏次数: {screenSwitchCount}/{maxScreenSwitches}
      </p>
      <p>切屏次数超过 {maxScreenSwitches} 次将自动提交试卷。</p>
    </Modal>
  );
};
