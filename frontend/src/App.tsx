import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Spin, Layout, Menu, Typography, Dropdown, Avatar } from "antd";
import {
  BookOutlined,
  FileTextOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

import { UserRole, LoginRequest } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/pages/LoginPage";
import QuestionManagement from "@/pages/teacher/QuestionManagement";
import ExamPaperManagement from "@/pages/teacher/ExamPaperManagement";
import ExamStatistics from "@/pages/teacher/ExamStatistics";
import AnswerGrading from "@/pages/teacher/AnswerGrading";
import StudentExamList from "@/pages/student/StudentExamList";
import ExamPage from "@/pages/student/ExamPage";
import StudentResults from "@/pages/student/StudentResults";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface AuthContextType {
  user: { role: UserRole; name?: string } | null;
  isAuthenticated: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuthContext();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const TeacherLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout } = useAuthContext();
  const [collapsed, setCollapsed] = useState(false);

  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: logout,
    },
  ];

  const menuItems: MenuProps["items"] = [
    {
      key: "/teacher/questions",
      icon: <BookOutlined />,
      label: "题库管理",
    },
    {
      key: "/teacher/exam-papers",
      icon: <FileTextOutlined />,
      label: "试卷管理",
    },
    {
      key: "/teacher/statistics",
      icon: <BarChartOutlined />,
      label: "成绩统计",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Title level={4} style={{ color: "#fff", margin: 0 }}>
            {collapsed ? "考" : "在线考试系统"}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["/teacher/questions"]}
          items={menuItems}
          onClick={({ key }) => {
            window.location.href = key;
          }}
        />
      </Sider>
      <Layout>
        <Header className="layout-header">
          <span style={{ color: "#fff" }}>教师端</span>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="layout-content">{children}</Content>
      </Layout>
    </Layout>
  );
};

const StudentLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout } = useAuthContext();
  const [collapsed, setCollapsed] = useState(false);

  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: logout,
    },
  ];

  const menuItems: MenuProps["items"] = [
    {
      key: "/student/exams",
      icon: <FileTextOutlined />,
      label: "我的考试",
    },
    {
      key: "/student/results",
      icon: <BarChartOutlined />,
      label: "我的成绩",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Title level={4} style={{ color: "#fff", margin: 0 }}>
            {collapsed ? "考" : "在线考试系统"}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["/student/exams"]}
          items={menuItems}
          onClick={({ key }) => {
            window.location.href = key;
          }}
        />
      </Sider>
      <Layout>
        <Header className="layout-header">
          <span style={{ color: "#fff" }}>学生端</span>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="layout-content">{children}</Content>
      </Layout>
    </Layout>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isTeacher, loading } = useAuthContext();

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && !e.newValue) {
        window.location.href = "/login";
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate
              to={isTeacher ? "/teacher/questions" : "/student/exams"}
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate
              to={isTeacher ? "/teacher/questions" : "/student/exams"}
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/teacher/questions"
        element={
          <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
            <TeacherLayout>
              <QuestionManagement />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/exam-papers"
        element={
          <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
            <TeacherLayout>
              <ExamPaperManagement />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/statistics"
        element={
          <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
            <TeacherLayout>
              <ExamStatistics />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/grading/:sessionId"
        element={
          <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
            <TeacherLayout>
              <AnswerGrading />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/exams"
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <StudentLayout>
              <StudentExamList />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/exam/:sessionId"
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <ExamPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/results"
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <StudentLayout>
              <StudentResults />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
