import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Typography,
  Divider,
  Checkbox,
  Radio,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import { apiService } from "@/services/api";
import {
  Question,
  QuestionType,
  DifficultyLevel,
  QuestionOption,
} from "@/types";
import {
  formatQuestionType,
  formatDifficulty,
  getDifficultyColor,
} from "@/utils/format";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    type: undefined as string | undefined,
    difficulty: undefined as string | undefined,
  });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const result = await apiService.getQuestions();
      setQuestions(result.content);
    } catch (error) {
      message.error("获取题目列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAdd = () => {
    setEditingQuestion(null);
    form.resetFields();
    form.setFieldsValue({
      type: QuestionType.SINGLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      score: 10,
    });
    setModalVisible(true);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    form.setFieldsValue({
      ...question,
      tags: question.tags.join(","),
      options: question.options.map((opt) => ({
        ...opt,
        label: opt.text,
      })),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteQuestion(id);
      message.success("删除成功");
      fetchQuestions();
    } catch (error) {
      message.error("删除失败");
    }
  };

  const handleSubmit = async (values: {
    type: QuestionType;
    content: string;
    imageUrl?: string;
    options: QuestionOption[];
    correctAnswer: string;
    correctAnswers?: string[];
    score: number;
    difficulty: DifficultyLevel;
    tags: string;
  }) => {
    try {
      let correctAnswer = values.correctAnswer;

      if (
        values.type === QuestionType.MULTIPLE_CHOICE &&
        values.correctAnswers
      ) {
        correctAnswer = JSON.stringify(values.correctAnswers);
      } else if (values.type === QuestionType.FILL_BLANK) {
        correctAnswer = JSON.stringify([values.correctAnswer]);
      }

      const questionData = {
        type: values.type,
        content: values.content,
        imageUrl: values.imageUrl,
        options:
          values.options
            ?.filter((o) => o.text?.trim())
            .map((opt, index) => ({
              id: index + 1,
              text: opt.text,
              isCorrect:
                values.type === QuestionType.SINGLE_CHOICE
                  ? opt.id === parseInt(values.correctAnswer)
                  : values.type === QuestionType.MULTIPLE_CHOICE
                    ? values.correctAnswers?.includes(String(opt.id))
                    : undefined,
            })) || [],
        correctAnswer,
        score: values.score,
        difficulty: values.difficulty,
        tags:
          values.tags
            ?.split(",")
            .map((t) => t.trim())
            .filter((t) => t) || [],
      };

      if (editingQuestion) {
        await apiService.updateQuestion(editingQuestion.id, questionData);
        message.success("更新成功");
      } else {
        await apiService.createQuestion(questionData);
        message.success("创建成功");
      }

      setModalVisible(false);
      fetchQuestions();
    } catch (error) {
      message.error("保存失败");
    }
  };

  const columns: ColumnsType<Question> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "题型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: QuestionType) => (
        <Tag color="blue">{formatQuestionType(type)}</Tag>
      ),
    },
    {
      title: "题干",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
    },
    {
      title: "分值",
      dataIndex: "score",
      key: "score",
      width: 80,
    },
    {
      title: "难度",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 80,
      render: (difficulty: DifficultyLevel) => (
        <Tag color={getDifficultyColor(difficulty)}>
          {formatDifficulty(difficulty)}
        </Tag>
      ),
    },
    {
      title: "标签",
      dataIndex: "tags",
      key: "tags",
      width: 200,
      render: (tags: string[]) => (
        <Space wrap>
          {tags?.map((tag) => (
            <Tag key={tag} color="cyan">
              {tag}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这道题吗？"
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

  const currentQuestionType = Form.useWatch("type", form);

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
            题库管理
          </Title>
          <Space>
            <Select
              placeholder="题型筛选"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, type: value })}
            >
              {Object.values(QuestionType).map((type) => (
                <Option key={type} value={type}>
                  {formatQuestionType(type)}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="难度筛选"
              allowClear
              style={{ width: 120 }}
              onChange={(value) =>
                setFilters({ ...filters, difficulty: value })
              }
            >
              {Object.values(DifficultyLevel).map((difficulty) => (
                <Option key={difficulty} value={difficulty}>
                  {formatDifficulty(difficulty)}
                </Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建题目
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={questions}
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
        title={editingQuestion ? "编辑题目" : "新建题目"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: QuestionType.SINGLE_CHOICE,
            difficulty: DifficultyLevel.MEDIUM,
            score: 10,
            options: [
              { id: 1, text: "" },
              { id: 2, text: "" },
              { id: 3, text: "" },
              { id: 4, text: "" },
            ],
          }}
        >
          <Form.Item
            name="type"
            label="题型"
            rules={[{ required: true, message: "请选择题型" }]}
          >
            <Select>
              {Object.values(QuestionType).map((type) => (
                <Option key={type} value={type}>
                  {formatQuestionType(type)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="题干"
            rules={[{ required: true, message: "请输入题干" }]}
          >
            <TextArea rows={3} placeholder="请输入题干内容" />
          </Form.Item>

          <Form.Item name="imageUrl" label="图片链接（可选）">
            <Input placeholder="请输入图片URL" />
          </Form.Item>

          {(currentQuestionType === QuestionType.SINGLE_CHOICE ||
            currentQuestionType === QuestionType.MULTIPLE_CHOICE ||
            currentQuestionType === QuestionType.TRUE_FALSE) && (
            <>
              <Divider>选项</Divider>

              {currentQuestionType === QuestionType.TRUE_FALSE ? (
                <Form.Item
                  name="correctAnswer"
                  label="正确答案"
                  rules={[{ required: true, message: "请选择正确答案" }]}
                >
                  <Radio.Group>
                    <Radio value="1">正确</Radio>
                    <Radio value="2">错误</Radio>
                  </Radio.Group>
                </Form.Item>
              ) : (
                <>
                  <Form.List name="options">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <Space
                            key={key}
                            style={{ display: "flex", marginBottom: 8 }}
                            align="baseline"
                          >
                            <Text strong>
                              {String.fromCharCode(65 + name)}.
                            </Text>
                            <Form.Item
                              {...restField}
                              name={[name, "text"]}
                              noStyle
                            >
                              <Input
                                placeholder="选项内容"
                                style={{ width: 300 }}
                              />
                            </Form.Item>
                            {fields.length > 2 && (
                              <Button
                                type="link"
                                danger
                                onClick={() => remove(name)}
                              >
                                删除
                              </Button>
                            )}
                          </Space>
                        ))}
                        <Form.Item>
                          <Button
                            type="dashed"
                            onClick={() => add()}
                            block
                            icon={<PlusOutlined />}
                          >
                            添加选项
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>

                  {currentQuestionType === QuestionType.SINGLE_CHOICE && (
                    <Form.Item
                      name="correctAnswer"
                      label="正确答案（选项序号）"
                      rules={[{ required: true, message: "请选择正确答案" }]}
                    >
                      <Radio.Group>
                        <Radio value="1">A</Radio>
                        <Radio value="2">B</Radio>
                        <Radio value="3">C</Radio>
                        <Radio value="4">D</Radio>
                      </Radio.Group>
                    </Form.Item>
                  )}

                  {currentQuestionType === QuestionType.MULTIPLE_CHOICE && (
                    <Form.Item
                      name="correctAnswers"
                      label="正确答案（可多选）"
                      rules={[{ required: true, message: "请选择正确答案" }]}
                    >
                      <Checkbox.Group>
                        <Checkbox value="1">A</Checkbox>
                        <Checkbox value="2">B</Checkbox>
                        <Checkbox value="3">C</Checkbox>
                        <Checkbox value="4">D</Checkbox>
                      </Checkbox.Group>
                    </Form.Item>
                  )}
                </>
              )}
            </>
          )}

          {currentQuestionType === QuestionType.FILL_BLANK && (
            <Form.Item
              name="correctAnswer"
              label="正确答案"
              rules={[{ required: true, message: "请输入正确答案" }]}
            >
              <Input placeholder="填空题的正确答案" />
            </Form.Item>
          )}

          <Divider />

          <Space wrap>
            <Form.Item
              name="score"
              label="分值"
              rules={[{ required: true, message: "请输入分值" }]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber min={1} max={100} />
            </Form.Item>

            <Form.Item
              name="difficulty"
              label="难度"
              rules={[{ required: true, message: "请选择难度" }]}
              style={{ marginBottom: 0 }}
            >
              <Select style={{ width: 120 }}>
                {Object.values(DifficultyLevel).map((difficulty) => (
                  <Option key={difficulty} value={difficulty}>
                    {formatDifficulty(difficulty)}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="tags"
              label="标签（逗号分隔）"
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="例如：数学,代数,方程" />
            </Form.Item>
          </Space>

          <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingQuestion ? "保存" : "创建"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuestionManagement;
