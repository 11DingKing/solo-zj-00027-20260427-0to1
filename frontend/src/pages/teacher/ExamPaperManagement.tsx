import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Typography,
  Divider,
  Row,
  Col,
  DatePicker,
  List,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { apiService } from "@/services/api";
import { ExamPaper, Question, QuestionType, DifficultyLevel } from "@/types";
import {
  formatQuestionType,
  formatDifficulty,
  formatDateTime,
  formatDuration,
  getDifficultyColor,
} from "@/utils/format";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ExamPaperManagement: React.FC = () => {
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);
  const [createMode, setCreateMode] = useState<"auto" | "manual">("auto");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [form] = Form.useForm();
  const [autoForm] = Form.useForm();

  const fetchExamPapers = async () => {
    setLoading(true);
    try {
      const result = await apiService.getExamPapers();
      setExamPapers(result);
    } catch (error) {
      message.error("获取试卷列表失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const result = await apiService.getQuestions();
      setQuestions(result.content);
    } catch (error) {
      message.error("获取题目列表失败");
    }
  };

  useEffect(() => {
    fetchExamPapers();
    fetchQuestions();
  }, []);

  const handleViewDetail = (paper: ExamPaper) => {
    setSelectedPaper(paper);
    setDetailModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteExamPaper(id);
      message.success("删除成功");
      fetchExamPapers();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleCreateAutoPaper = async (values: {
    name: string;
    description?: string;
    duration: number;
    passingScore: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    timeRange: [dayjs.Dayjs, dayjs.Dayjs];
    questionRequirements: {
      type: QuestionType;
      difficulty: DifficultyLevel;
      count: number;
      scorePerQuestion: number;
    }[];
    totalScore: number;
  }) => {
    try {
      const paperData = {
        name: values.name,
        description: values.description,
        duration: values.duration,
        passingScore: values.passingScore,
        shuffleQuestions: values.shuffleQuestions,
        shuffleOptions: values.shuffleOptions,
        startTime: values.timeRange[0].toISOString(),
        endTime: values.timeRange[1].toISOString(),
        questionRequirements: values.questionRequirements || [],
        totalScore: values.totalScore,
      };

      await apiService.autoGeneratePaper(paperData);
      message.success("试卷创建成功");
      setCreateModalVisible(false);
      fetchExamPapers();
      autoForm.resetFields();
    } catch (error) {
      message.error("创建试卷失败");
    }
  };

  const handleCreateManualPaper = async (values: {
    name: string;
    description?: string;
    duration: number;
    passingScore: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    timeRange: [dayjs.Dayjs, dayjs.Dayjs];
  }) => {
    if (selectedQuestions.length === 0) {
      message.error("请至少选择一道题目");
      return;
    }

    try {
      const paperData = {
        name: values.name,
        description: values.description,
        duration: values.duration,
        passingScore: values.passingScore,
        shuffleQuestions: values.shuffleQuestions,
        shuffleOptions: values.shuffleOptions,
        startTime: values.timeRange[0].toISOString(),
        endTime: values.timeRange[1].toISOString(),
        questionIds: selectedQuestions,
      };

      await apiService.createManualPaper(paperData);
      message.success("试卷创建成功");
      setCreateModalVisible(false);
      fetchExamPapers();
      form.resetFields();
      setSelectedQuestions([]);
    } catch (error) {
      message.error("创建试卷失败");
    }
  };

  const columns: ColumnsType<ExamPaper> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "试卷名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "总分/及格分",
      key: "score",
      render: (_, record) =>
        `${record.totalScore}分 / ${record.passingScore}分`,
    },
    {
      title: "考试时长",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number) => formatDuration(duration),
    },
    {
      title: "考试时间",
      key: "time",
      render: (_, record) => (
        <div>
          <div>开始: {formatDateTime(record.startTime)}</div>
          <div>结束: {formatDateTime(record.endTime)}</div>
        </div>
      ),
    },
    {
      title: "题目数量",
      key: "questionCount",
      render: (_, record) => `${record.examQuestions?.length || 0} 道`,
    },
    {
      title: "设置",
      key: "settings",
      render: (_, record) => (
        <Space wrap>
          {record.shuffleQuestions && <Tag color="blue">乱序出题</Tag>}
          {record.shuffleOptions && <Tag color="orange">乱序选项</Tag>}
        </Space>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<BarChartOutlined />}
            onClick={() => (window.location.href = "/teacher/statistics")}
          >
            统计
          </Button>
          <Popconfirm
            title="确定要删除这份试卷吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalSelectedScore = selectedQuestions.reduce((sum, id) => {
    const q = questions.find((q) => q.id === id);
    return sum + (q?.score || 0);
  }, 0);

  return (
    <div>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            试卷管理
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCreateModalVisible(true);
              setCreateMode("auto");
            }}
          >
            创建试卷
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={examPapers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="创建试卷"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          setSelectedQuestions([]);
          form.resetFields();
          autoForm.resetFields();
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Button.Group>
            <Button
              type={createMode === "auto" ? "primary" : "default"}
              onClick={() => setCreateMode("auto")}
            >
              自动组卷
            </Button>
            <Button
              type={createMode === "manual" ? "primary" : "default"}
              onClick={() => setCreateMode("manual")}
            >
              手动组卷
            </Button>
          </Button.Group>
        </div>

        {createMode === "auto" ? (
          <Form
            form={autoForm}
            layout="vertical"
            onFinish={handleCreateAutoPaper}
            initialValues={{
              duration: 60,
              passingScore: 60,
              shuffleQuestions: false,
              shuffleOptions: false,
              totalScore: 100,
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="试卷名称"
                  rules={[{ required: true, message: "请输入试卷名称" }]}
                >
                  <Input placeholder="例如：2024年春季学期期中考试" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="totalScore"
                  label="总分"
                  rules={[{ required: true, message: "请输入总分" }]}
                >
                  <InputNumber min={10} max={1000} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="试卷描述">
              <TextArea rows={2} placeholder="试卷说明（可选）" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="duration"
                  label="考试时长（分钟）"
                  rules={[{ required: true, message: "请输入考试时长" }]}
                >
                  <InputNumber min={1} max={480} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="passingScore"
                  label="及格分数"
                  rules={[{ required: true, message: "请输入及格分数" }]}
                >
                  <InputNumber min={0} max={1000} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="timeRange"
                  label="考试时间范围"
                  rules={[{ required: true, message: "请选择考试时间" }]}
                >
                  <RangePicker
                    showTime
                    style={{ width: "100%" }}
                    format="YYYY-MM-DD HH:mm"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="shuffleQuestions"
                  label="乱序出题"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shuffleOptions"
                  label="乱序选项"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Divider>抽题规则（按题型和难度）</Divider>

            <Form.List name="questionRequirements">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row
                      key={key}
                      gutter={16}
                      style={{ marginBottom: 8 }}
                      align="middle"
                    >
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, "type"]}
                          noStyle
                          rules={[{ required: true, message: "选择题型" }]}
                        >
                          <Select placeholder="题型" style={{ width: "100%" }}>
                            {Object.values(QuestionType).map((type) => (
                              <Option key={type} value={type}>
                                {formatQuestionType(type)}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, "difficulty"]}
                          noStyle
                          rules={[{ required: true, message: "选择难度" }]}
                        >
                          <Select placeholder="难度" style={{ width: "100%" }}>
                            {Object.values(DifficultyLevel).map(
                              (difficulty) => (
                                <Option key={difficulty} value={difficulty}>
                                  {formatDifficulty(difficulty)}
                                </Option>
                              ),
                            )}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "count"]}
                          noStyle
                          rules={[{ required: true, message: "输入数量" }]}
                        >
                          <InputNumber
                            min={1}
                            placeholder="题数"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "scorePerQuestion"]}
                          noStyle
                          rules={[{ required: true, message: "输入分值" }]}
                        >
                          <InputNumber
                            min={1}
                            placeholder="每题分值"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Button type="link" danger onClick={() => remove(name)}>
                          删除
                        </Button>
                      </Col>
                    </Row>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加抽题规则
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
              <Space>
                <Button onClick={() => setCreateModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  创建试卷
                </Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateManualPaper}
            initialValues={{
              duration: 60,
              passingScore: 60,
              shuffleQuestions: false,
              shuffleOptions: false,
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="试卷名称"
                  rules={[{ required: true, message: "请输入试卷名称" }]}
                >
                  <Input placeholder="例如：2024年春季学期期中考试" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="timeRange"
                  label="考试时间范围"
                  rules={[{ required: true, message: "请选择考试时间" }]}
                >
                  <RangePicker
                    showTime
                    style={{ width: "100%" }}
                    format="YYYY-MM-DD HH:mm"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="试卷描述">
              <TextArea rows={2} placeholder="试卷说明（可选）" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name="duration"
                  label="考试时长（分钟）"
                  rules={[{ required: true, message: "请输入考试时长" }]}
                >
                  <InputNumber min={1} max={480} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="passingScore"
                  label="及格分数"
                  rules={[{ required: true, message: "请输入及格分数" }]}
                >
                  <InputNumber min={0} max={1000} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="shuffleQuestions"
                  label="乱序出题"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="shuffleOptions"
                  label="乱序选项"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Divider>
              选择题目
              <Tag color={selectedQuestions.length > 0 ? "green" : "default"}>
                已选: {selectedQuestions.length} 题, 总分: {totalSelectedScore}{" "}
                分
              </Tag>
            </Divider>

            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              <List
                dataSource={questions}
                renderItem={(question) => (
                  <List.Item
                    actions={[
                      <Tag key="type">{formatQuestionType(question.type)}</Tag>,
                      <Tag
                        key="difficulty"
                        color={
                          question.difficulty === DifficultyLevel.EASY
                            ? "green"
                            : question.difficulty === DifficultyLevel.MEDIUM
                              ? "orange"
                              : "red"
                        }
                      >
                        {formatDifficulty(question.difficulty)}
                      </Tag>,
                      <Tag key="score">{question.score}分</Tag>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Checkbox
                          checked={selectedQuestions.includes(question.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedQuestions([
                                ...selectedQuestions,
                                question.id,
                              ]);
                            } else {
                              setSelectedQuestions(
                                selectedQuestions.filter(
                                  (id) => id !== question.id,
                                ),
                              );
                            }
                          }}
                        />
                      }
                      title={question.content}
                      description={
                        <Space wrap>
                          {question.tags?.map((tag) => (
                            <Tag key={tag} color="cyan">
                              {tag}
                            </Tag>
                          ))}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>

            <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
              <Space>
                <Button onClick={() => setCreateModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  创建试卷
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="试卷详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedPaper && (
          <div>
            <Card>
              <Title level={4}>{selectedPaper.name}</Title>
              <Row gutter={16}>
                <Col span={6}>
                  <p>
                    <strong>总分:</strong> {selectedPaper.totalScore}分
                  </p>
                </Col>
                <Col span={6}>
                  <p>
                    <strong>及格分:</strong> {selectedPaper.passingScore}分
                  </p>
                </Col>
                <Col span={6}>
                  <p>
                    <strong>时长:</strong>{" "}
                    {formatDuration(selectedPaper.duration)}
                  </p>
                </Col>
                <Col span={6}>
                  <p>
                    <strong>题目数:</strong>{" "}
                    {selectedPaper.examQuestions?.length || 0}题
                  </p>
                </Col>
              </Row>
              <p>
                <strong>考试时间:</strong>{" "}
                {formatDateTime(selectedPaper.startTime)} ~{" "}
                {formatDateTime(selectedPaper.endTime)}
              </p>
              <Space>
                {selectedPaper.shuffleQuestions && (
                  <Tag color="blue">乱序出题</Tag>
                )}
                {selectedPaper.shuffleOptions && (
                  <Tag color="orange">乱序选项</Tag>
                )}
              </Space>
            </Card>

            <Divider>题目列表</Divider>

            <List
              dataSource={selectedPaper.examQuestions}
              renderItem={(examQuestion, index) => (
                <Card
                  key={examQuestion.id}
                  size="small"
                  style={{ marginBottom: 12 }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <Tag style={{ marginRight: 8 }}>
                      {formatQuestionType(examQuestion.question.type)}
                    </Tag>
                    <Tag
                      color={getDifficultyColor(
                        examQuestion.question.difficulty,
                      )}
                      style={{ marginRight: 8 }}
                    >
                      {formatDifficulty(examQuestion.question.difficulty)}
                    </Tag>
                    <Tag>{examQuestion.question.score}分</Tag>
                  </div>
                  <p style={{ marginTop: 8 }}>
                    <strong>{index + 1}. </strong>
                    {examQuestion.question.content}
                  </p>
                  {examQuestion.question.tags?.length > 0 && (
                    <Space wrap>
                      {examQuestion.question.tags.map((tag) => (
                        <Tag key={tag} color="cyan">
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                  )}
                </Card>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExamPaperManagement;
