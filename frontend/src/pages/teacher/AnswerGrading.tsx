import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  message,
  Typography,
  Tag,
  Divider,
  Spin,
  Row,
  Col,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

import { apiService } from "@/services/api";
import { ExamAnswer, ExamResult } from "@/types";
import { getDifficultyColor } from "@/utils/format";

const { Title, Text } = Typography;
const { TextArea } = Input;

const AnswerGrading: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (sessionId) {
      fetchData(parseInt(sessionId));
    }
  }, [sessionId]);

  const fetchData = async (id: number) => {
    setLoading(true);
    try {
      const [answersData, resultData] = await Promise.all([
        apiService.getAnswersForGrading(id),
        apiService.getExamResultBySession(id),
      ]);
      setAnswers(answersData);
      setExamResult(resultData);
    } catch (error) {
      message.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (
    answerId: number,
    values: { score: number; comment?: string },
  ) => {
    try {
      await apiService.gradeAnswer(answerId, values.score, values.comment);
      message.success("评分成功");
      if (sessionId) {
        fetchData(parseInt(sessionId));
      }
    } catch (error) {
      message.error("评分失败");
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

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/teacher/statistics")}
            style={{ marginBottom: 16 }}
          >
            返回
          </Button>

          {examResult && (
            <Card size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>学生：</Text> {examResult.student?.name}
                </Col>
                <Col span={8}>
                  <Text strong>试卷：</Text> {examResult.examPaper?.name}
                </Col>
                <Col span={8}>
                  <Text strong>自动得分：</Text> {examResult.autoScore}分
                  {examResult.teacherScore !== undefined && (
                    <Text type="secondary">
                      {" "}
                      (教师加分: {examResult.teacherScore}分)
                    </Text>
                  )}
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={8}>
                  <Text strong>总分：</Text>
                  <Tag color={examResult.isPassed ? "green" : "red"}>
                    {examResult.totalScore}分
                  </Tag>
                </Col>
                <Col span={8}>
                  <Text strong>是否及格：</Text>
                  <Tag color={examResult.isPassed ? "green" : "red"}>
                    {examResult.isPassed ? "及格" : "不及格"}
                  </Tag>
                </Col>
              </Row>
            </Card>
          )}
        </div>

        <Title level={5}>填空题批改</Title>

        {answers.filter(
          (a) => !a.isCorrect !== undefined && a.teacherScore === undefined,
        ).length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Text type="secondary">暂无需要批改的填空题</Text>
          </div>
        ) : (
          answers
            .filter((a) => a.teacherScore === undefined)
            .map((answer, index) => (
              <Card
                key={answer.id}
                className="answer-detail-card pending"
                style={{ marginBottom: 16 }}
              >
                <Form
                  layout="vertical"
                  onFinish={(values) => handleGrade(answer.id, values)}
                  initialValues={{ score: 0 }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <Space>
                      <Tag>第 {index + 1} 题</Tag>
                      <Tag color="orange">待批改</Tag>
                    </Space>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <Text strong>学生答案：</Text>
                    <Text>{answer.studentAnswer || "(未作答)"}</Text>
                  </div>

                  {answer.teacherComment && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong type="secondary">
                        教师批注：
                      </Text>
                      <Text type="secondary">{answer.teacherComment}</Text>
                    </div>
                  )}

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        name="score"
                        label="给分"
                        rules={[{ required: true, message: "请输入分数" }]}
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          style={{ width: "100%" }}
                          placeholder="请输入分数"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="comment" label="批注（可选）">
                        <TextArea rows={1} placeholder="输入批注" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item style={{ marginTop: 22 }}>
                        <Button type="primary" htmlType="submit">
                          提交评分
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            ))
        )}

        <Divider>已批改题目</Divider>

        {answers.filter((a) => a.teacherScore !== undefined).length === 0 ? (
          <div style={{ textAlign: "center", padding: 20 }}>
            <Text type="secondary">暂无已批改题目</Text>
          </div>
        ) : (
          answers
            .filter((a) => a.teacherScore !== undefined)
            .map((answer, index) => (
              <Card
                key={answer.id}
                className="answer-detail-card correct"
                style={{ marginBottom: 16 }}
                size="small"
              >
                <Space>
                  <Tag>第 {index + 1} 题</Tag>
                  <Tag color="green">已批改</Tag>
                  <Tag>得分: {answer.teacherScore}分</Tag>
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Text strong>学生答案：</Text>
                  <Text>{answer.studentAnswer || "(未作答)"}</Text>
                </div>
                {answer.teacherComment && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong type="secondary">
                      批注：
                    </Text>
                    <Text type="secondary">{answer.teacherComment}</Text>
                  </div>
                )}
              </Card>
            ))
        )}
      </Card>
    </div>
  );
};

export default AnswerGrading;
