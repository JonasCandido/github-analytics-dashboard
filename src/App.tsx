import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Repo } from "./types/RepoTypes";

export default function GithubDashboard() {
  const [darkMode, setDarkMode] = useState(() => {return localStorage.getItem("theme") === "dark";});
  const [username, setUsername] = useState("octocat");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    setRepos([]);

    try {
      const res = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100`
      );

      if (res.status === 404) {
        setError("Usuário não encontrado no GitHub.");
        return;
      }

      if (!res.ok) {
        setError("Erro ao buscar dados do GitHub.");
        return;
      }

      const data: Repo[] = await res.json();
      setRepos(data);
    } catch {
      setError("Erro de conexão com o GitHub.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const starsData = repos.map((r) => ({
    name: r.name,
    stars: r.stargazers_count,
  }));

  const languageCount = repos.reduce<Record<string, number>>((acc, repo) => {
    if (!repo.language) return acc;
    acc[repo.language] = (acc[repo.language] || 0) + 1;
    return acc;
  }, {});

  const languageData = Object.entries(languageCount).map(([lang, count]) => ({
    language: lang,
    value: count,
  }));

  const streakTimeline = Object.entries(
    repos.reduce<Record<string, number>>((acc, repo) => {
      const date = repo.updated_at.slice(0, 10);
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {})
  ).map(([date, activity]) => ({ date, activity }));

  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1"];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-100 transition-colors">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">GitHub Analytics</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Métricas públicas do GitHub
            </p>
          </div>

          <Button variant="outline" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "🌙 Dark" : "☀️ Light"}
          </Button>
        </div>

        <div className="flex gap-2 max-w-sm">
          <Input
            placeholder="GitHub username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button onClick={fetchRepos} disabled={loading}>
            {loading ? "Carregando..." : "Buscar"}
          </Button>
        </div>

        {error && (
          <div className="max-w-sm rounded-md border border-red-500/30 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {!error && repos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stars por Repositório</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer>
                  <LineChart data={starsData}>
                    <XAxis dataKey="name" hide />
                    <YAxis tick={{ fill: darkMode ? "#e5e7eb" : "#1f2937" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? "#ffffff" : "#000000",
                        borderColor: darkMode ? "#1e293b" : "#e5e7eb",
                        color: darkMode ? "#000000" : "#ffffff",
                      }} />
                    <Line dataKey="stars" stroke={darkMode ? "#ffffff" : "#000000"} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quantidade de repositórios que usam certa linguagem</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={languageData} dataKey="value" nameKey="language">
                      {languageData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer>
                  <BarChart data={streakTimeline}>
                    <XAxis dataKey="date" tick={{ fill: darkMode ? "#e5e7eb" : "#1f2937" }} />
                    <YAxis tick={{ fill: darkMode ? "#e5e7eb" : "#1f2937" }} />
                    <Tooltip
                      formatter={(value) => [value, "Repositórios atualizados"]}
                      contentStyle={{
                        backgroundColor: darkMode ? "#ffffff" : "#000000",
                        borderColor: darkMode ? "#000000" : "#ffffff",
                      }}
                      labelStyle={{
                        color: darkMode ? "#000000" : "#ffffff",
                      }}
                      itemStyle={{
                        color: darkMode ? "#000000" : "#ffffff",
                      }}
                    />
                    <Bar dataKey="activity" fill={darkMode ? "#ffffff" : "#000000"} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Repositórios</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {topRepos.map((r) => (
                    <li key={r.name} className="flex justify-between">
                      <span>{r.name}</span>
                      <span>⭐ {r.stargazers_count}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
