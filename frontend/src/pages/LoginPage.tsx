import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Radio, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/App';
import { UserRole } from '@/types';

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: {
    username: string;
    password: string;
    role: UserRole;
  }) => {
    setLoading(true);
    try {
      await login({
        username: values.username,
        password: values.password
      });
      message.success('登录成功');
      navigate(values.role === UserRole.TEACHER ? '/teacher/questions' : '/student/exams');
    } catch (error: any) {
      const errorMessage = error.userMessage || error.response?.data?.message || '登录失败，请检查用户名和密码';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>在线考试系统</Title>
          <p style={{ color: '#666' }}>请登录以继续</p>
        </div>
        
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          initialValues={{ role: UserRole.STUDENT }}
          size="large"
        >
          <Form.Item
            name="role"
            rules={[{ required: true, message: '请选择登录角色' }]}
          >
            <Radio.Group>
              <Radio value={UserRole.TEACHER}>教师</Radio>
              <Radio value={UserRole.STUDENT}>学生</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, fontSize: 12, color: '#999', textAlign: 'center' }}>
          <p>默认账号：</p>
          <p>教师：teacher / teacher123</p>
          <p>学生：student1 / student123</p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
