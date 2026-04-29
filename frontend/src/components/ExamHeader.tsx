import React from "react";
import { Button, Tag, Typography, Space, Statistic } from "antd";
import { ClockCircleOutlined, SafetyOutlined } from "@ant-design/icons";
import { formatCountdown } from "@/utils/format";

const { Title } = Typography;

interface ExamHeaderProps {
  examName: string;
  timeRemaining: number;
  screenSwitchCount: number;
  maxScreenSwitches: number;
  onSubmit: () => void;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  examName,
  timeRemaining,
  screenSwitchCount,
  maxScreenSwitches,
  onSubmit,
}) => {
  return (
    <div className="countdown-header">
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          {examName}
        </Title>
        <Tag
          icon={<SafetyOutlined />}
          color={screenSwitchCount > 0 ? "orange" : "green"}
        >
          切屏次数: {screenSwitchCount}/{maxScreenSwitches}
        </Tag>
      </div>

      <Space>
        <Statistic
          value={formatCountdown(timeRemaining)}
          valueStyle={{
            color: timeRemaining < 300 ? "#ff4d4f" : "#1890ff",
            fontSize: 24,
            fontWeight: "bold",
          }}
          prefix={<ClockCircleOutlined />}
        />
        <Button type="primary" onClick={onSubmit}>
          交卷
        </Button>
      </Space>
    </div>
  );
};
