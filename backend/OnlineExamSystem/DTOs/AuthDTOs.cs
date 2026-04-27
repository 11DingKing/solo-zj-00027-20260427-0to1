using OnlineExamSystem.Models;

namespace OnlineExamSystem.DTOs;

public record LoginRequest(string Username, string Password);

public record RegisterRequest(string Username, string Password, string Name, UserRole Role);

public record UserDTO(
    int Id,
    string Username,
    string Name,
    UserRole Role
);

public record LoginResponse(
    string Token,
    UserDTO User
);
