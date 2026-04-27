import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  List,
  Tag,
  Typography,
  Space,
  message,
  Spin,
  Empty
} from 'antd';
import {
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { apiService } from '@/services/api';
import { ExamPaper } from '@/types';
import { formatDuration, formatDateTime } from '@/utils/format';

const { Title, Text } = Typography;

const StudentExamList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);

  useEffect(() => {
    fetchExamPapers();
  }, []);

  const fetchExamPapers = async () => {
    setLoading(true);
    try {
      const result = await apiService.getStudentExamPapers();
      setExamPapers(result);
    } catch (error) {
      message.error('获取考试列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = (exam: ExamPaper) => {
    const now = dayjs();
    const startTime = dayjs(exam.startTime);
    const endTime = dayjs(exam.endTime);

    if (now.isBefore(startTime)) {
      return { status: 'upcoming', text: '未开始', color: 'blue', icon: <ClockCircleOutlined /> };
    } else if (now.isAfter(endTime)) {
      return { status: 'ended', text: '已结束', color: 'default', icon: <CheckCircleOutlined /> };
    } else {
      return { status: 'ongoing', text: '进行中', color: 'green', icon: <PlayCircleOutlined /> };
    }
  };

  const handleStartExam = async (examId: number) => {
    try {
      const session = await apiService.startExam(examId);
      navigate(`/student/exam/${session.id}`);
    } catch (error: any) {
      if (error.response?.status === 400) {
        message.error(error.response.data || '无法开始考试');
      } else {
        message.error('开始考试失败');
      }
    }
  };

  return (
    <div>
      <Card>
        <Title level={4} style={{ marginBottom: 24 }}>我的考试</Title>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <Spin size="large" />
          </div>
        ) : examPapers.length === 0 ? (
          <Empty description="暂无考试" />
        ) : (
          <List
            dataSource={examPapers}
            renderItem={(exam) => {
              const examStatus = getExamStatus(exam);
              return (
                <List.Item
                  actions={[
                    examStatus.status === 'ongoing' ? (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartExam(exam.id)}
                      >
                        开始考试
                      </Button>
                    ) : (
                      <Button
                        disabled
                        icon={examStatus.icon}
                      >
                        {examStatus.text}
                      </Button>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 48,
                        height: 48,
                        backgroundColor: '#e6f7ff',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      </div>
                    }
                    title={
                      <Space>
                        {exam.name}
                        <Tag color={examStatus.color}>
                          {examStatus.icon} {examStatus.text}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Text type="secondary">考试时间：</Text>
                          <Text>{formatDateTime(exam.startTime)} ~ {formatDateTime(exam.endTime)}</Text>
                        </Space>
                        <Space>
                          <Text type="secondary">时长：</Text>
                          <Text>{formatDuration(exam.duration)}</Text>
                          <Text type="secondary">总分：</Text>
                          <Text>{exam.totalScore}分</Text>
                          <Text type="secondary">及格分：</Text>
                          <Text>{exam.passingScore}分</Text>
                        </Space>
                        <Space>
                          {exam.shuffleQuestions && <Tag color="blue">乱序出题</Tag>}
                          {exam.shuffleOptions && <Tag color="orange">乱序选项</Tag>}
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default StudentExamList;
