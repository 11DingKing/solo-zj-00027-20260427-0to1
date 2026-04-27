import React, { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  message,
  Spin
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import type { ColumnsType } from 'antd/es/table';

import { apiService } from '@/services/api';
import { ExamPaper, ExamStats, QuestionStat, TagStat, ScoreDistribution } from '@/types';
import { formatQuestionType } from '@/utils/format';

const { Title } = Typography;
const { Option } = Select;

const ExamStatistics: React.FC = () => {
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [stats, setStats] = useState<ExamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingStats, setFetchingStats] = useState(false);

  useEffect(() => {
    fetchExamPapers();
  }, []);

  const fetchExamPapers = async () => {
    setLoading(true);
    try {
      const result = await apiService.getExamPapers();
      setExamPapers(result);
    } catch (error) {
      message.error('获取试卷列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (examId: number) => {
    setFetchingStats(true);
    try {
      const result = await apiService.getExamStats(examId);
      setStats(result);
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setFetchingStats(false);
    }
  };

  const handleExamChange = (examId: number) => {
    setSelectedExamId(examId);
    fetchStats(examId);
  };

  const questionColumns: ColumnsType<QuestionStat> = [
    {
      title: '题号',
      dataIndex: 'questionId',
      key: 'questionId',
      width: 80
    },
    {
      title: '题干',
      dataIndex: 'questionContent',
      key: 'questionContent',
      ellipsis: true
    },
    {
      title: '作答人数',
      dataIndex: 'totalAttempts',
      key: 'totalAttempts'
    },
    {
      title: '正确人数',
      dataIndex: 'correctCount',
      key: 'correctCount'
    },
    {
      title: '正确率',
      key: 'correctRate',
      render: (_, record) => (
        <Tag color={record.correctRate >= 0.7 ? 'green' : record.correctRate >= 0.4 ? 'orange' : 'red'}>
          {(record.correctRate * 100).toFixed(1)}%
        </Tag>
      )
    },
    {
      title: '区分度',
      key: 'discrimination',
      render: (_, record) => (
        <Tag color={record.discrimination >= 0.4 ? 'green' : record.discrimination >= 0.2 ? 'blue' : 'orange'}>
          {record.discrimination.toFixed(2)}
        </Tag>
      )
    }
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>成绩统计</Title>
          <Select
            placeholder="请选择试卷"
            style={{ width: 300 }}
            loading={loading}
            onChange={handleExamChange}
            value={selectedExamId}
            allowClear
          >
            {examPapers.map(paper => (
              <Option key={paper.id} value={paper.id}>
                {paper.name}
              </Option>
            ))}
          </Select>
        </div>

        {!selectedExamId ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <p>请选择试卷查看统计数据</p>
          </div>
        ) : fetchingStats ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <Spin size="large" />
          </div>
        ) : stats ? (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="平均分"
                    value={stats.avgScore}
                    precision={1}
                    suffix="分"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="最高分"
                    value={stats.maxScore}
                    suffix="分"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="最低分"
                    value={stats.minScore}
                    suffix="分"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="参考人数"
                    value={stats.totalStudents}
                    suffix="人"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="分数段分布" className="stats-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="人数" fill="#1890ff" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="知识点掌握雷达图" className="stats-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={stats.tagStats}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="tag" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="正确率"
                        dataKey="correctRate"
                        stroke="#1890ff"
                        fill="#1890ff"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            <Card title="题目统计详情" style={{ marginTop: 24 }}>
              <Table
                columns={questionColumns}
                dataSource={stats.questionStats}
                rowKey="questionId"
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `共 ${total} 题`
                }}
              />
            </Card>
          </>
        ) : null}
      </Card>
    </div>
  );
};

export default ExamStatistics;
