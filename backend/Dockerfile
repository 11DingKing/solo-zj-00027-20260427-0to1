FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY nuget.config .
COPY ["OnlineExamSystem/OnlineExamSystem.csproj", "OnlineExamSystem/"]
RUN dotnet restore "OnlineExamSystem/OnlineExamSystem.csproj" --configfile nuget.config

COPY . .
WORKDIR "/src/OnlineExamSystem"
RUN dotnet build "OnlineExamSystem.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "OnlineExamSystem.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5000

COPY --from=publish /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:5000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "OnlineExamSystem.dll"]
