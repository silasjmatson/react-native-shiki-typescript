import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  createHighlighterCore,
  type HighlighterCore,
  type ThemedToken,
} from "@shikijs/core";
import { createNativeEngine } from "react-native-shiki-engine";
import tsx from "@shikijs/langs/tsx";
import typescript from "@shikijs/langs/typescript";
import catppuccinMocha from "@shikijs/themes/catppuccin-mocha";

const TEST_CODE = `import { View } from 'react-native';

const ExampleScreen: React.FC = () => {
  let count = 0;
  var legacy = "old";

  return <View />;
};

export default ExampleScreen;`;

type TokenInfo = {
  content: string;
  color: string;
  scopes: string;
};

export default function App() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function highlight() {
      try {
        const engine = createNativeEngine();
        const highlighter: HighlighterCore = await createHighlighterCore({
          themes: [catppuccinMocha],
          langs: [tsx, typescript],
          engine,
        });

        const result = highlighter.codeToTokens(TEST_CODE, {
          lang: "tsx",
          theme: "catppuccin-mocha",
          includeExplanation: "scopeName",
        });

        const tokenInfos: TokenInfo[] = [];
        for (const line of result.tokens) {
          for (const token of line) {
            const explanations = (token as ThemedToken & { explanation?: Array<{ scopeName: string }> }).explanation;
            const scopes = explanations?.map((e) => e.scopeName).join(" > ") || "unknown";
            tokenInfos.push({
              content: token.content,
              color: token.color || "#fff",
              scopes,
            });
          }
          tokenInfos.push({ content: "\n", color: "#fff", scopes: "newline" });
        }

        setTokens(tokenInfos);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    highlight();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Shiki TSX Token Scopes</Text>

      {loading && <Text style={styles.loading}>Loading highlighter...</Text>}
      {error && <Text style={styles.error}>Error: {error}</Text>}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Highlighted Code:</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
            {tokens.map((t, i) => (
              <Text key={i} style={{ color: t.color }}>
                {t.content}
              </Text>
            ))}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Token Analysis:</Text>
        <Text style={styles.hint}>
          Look for "const", "let", "var" - they should have scope like
          "storage.type" or "keyword" but may show "variable.other.readwrite"
        </Text>

        {tokens
          .filter((t) => t.content.trim() && t.scopes !== "newline")
          .map((t, i) => (
            <View key={i} style={styles.tokenRow}>
              <Text style={[styles.tokenContent, { color: t.color }]}>
                "{t.content}"
              </Text>
              <Text style={styles.tokenScopes}>{t.scopes}</Text>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e2e",
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#cdd6f4",
    textAlign: "center",
    marginBottom: 10,
  },
  loading: {
    color: "#a6adc8",
    textAlign: "center",
  },
  error: {
    color: "#f38ba8",
    textAlign: "center",
    padding: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#89b4fa",
    marginTop: 16,
    marginBottom: 8,
  },
  hint: {
    color: "#a6adc8",
    fontSize: 12,
    marginBottom: 12,
    fontStyle: "italic",
  },
  codeBlock: {
    backgroundColor: "#313244",
    padding: 12,
    borderRadius: 8,
  },
  code: {
    fontFamily: "monospace",
    fontSize: 14,
  },
  tokenRow: {
    backgroundColor: "#313244",
    padding: 8,
    marginBottom: 4,
    borderRadius: 4,
  },
  tokenContent: {
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "bold",
  },
  tokenScopes: {
    color: "#a6adc8",
    fontSize: 11,
    marginTop: 2,
    fontFamily: "monospace",
  },
});
