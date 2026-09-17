import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";

const backendBaseUrl =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:3000";

export default function App() {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("html");
  const [stdinInput, setStdinInput] = useState("");
  const [output, setOutput] = useState("");

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
  }

async function runCode() {
    const code = editorRef.current?.getValue() || "";

    setOutput("");

    // =========================
    // HTML
    // =========================
    if (language === "html") {
        setHtmlOutput(code);
        return;
    }

    // =========================
    // CSS
    // =========================
    if (language === "css") {
        setHtmlOutput(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    ${code}
                </style>
            </head>
            <body>
                <h1>CSS Preview</h1>
                <p>This page is controlled by your CSS.</p>
            </body>
            </html>
        `);

        return;
    }

    // =========================
    // JavaScript
    // =========================
    if (language === "javascript") {
        try {
            const logs = [];

            const originalLog = console.log;

            console.log = (...args) => {
                logs.push(args.join(" "));
            };

            try {
                eval(code);
            } finally {
                console.log = originalLog;
            }

            setOutput(logs.join("\n") || "No output");
        } catch (err) {
            setOutput(`JavaScript Error: ${err.message}`);
        }

        return;
    }

    // =========================
    // JSON
    // =========================
    if (language === "json") {
        try {
            const parsed = JSON.parse(code);

            setOutput(
                JSON.stringify(parsed, null, 2)
            );
        } catch (err) {
            setOutput(`JSON Error: ${err.message}`);
        }

        return;
    }

    // =========================
    // Backend languages
    // =========================

    let backendLang = language;

    if (language === "shell") {
        backendLang = "bash";
    }

    setOutput(`Running ${backendLang}...`);

    try {
        const res = await fetch(`${backendBaseUrl}/run`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                code,
                language: backendLang,
                input: stdinInput
            })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            setOutput(
                data.error ||
                `Backend error: ${res.status}`
            );

            return;
        }

        setOutput(
            data.output ??
            data.error ??
            "Program produced no output."
        );

    } catch (err) {
        setOutput(
            `Cannot connect to compiler backend.\n\n` +
            `${err.message}`
        );
    }
}
const templates = {
  javascript: "console.log('Hello JS')",
  python: "print('Hello Python')",
  cpp: "#include <iostream>\nint main(){ std::cout << \"Hello\"; }",
  java: "public class Main { public static void main(String[] args){ System.out.println(\"Hello\"); } }",
  go: "package main\nimport \"fmt\"\nfunc main(){ fmt.Println(\"Hello Go\") }",
  rust: "fn main(){ println!(\"Hello Rust\"); }",
  php: "<?php echo 'Hello PHP'; ?>",
  ruby: "puts 'Hello Ruby'",
  shell: "echo Hello Bash"
};

  function saveCode() {
    const code = editorRef.current.getValue();
    const blob = new Blob([code], { type: "text/plain" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `code.${language}`;
    a.click();
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* Toolbar */}
      <div style={{
        height: "50px",
        background: "#2d2d2d",
        display: "flex",
        alignItems: "center",
        padding: "0 10px"
      }}>
        
       <select
  value={language}
  onChange={(e) => setLanguage(e.target.value)}
  style={{ marginRight: "10px" }}
>
  <option value="html">HTML</option>
  <option value="javascript">JavaScript</option>
  <option value="typescript">TypeScript</option>
  <option value="json">JSON</option>
  <option value="css">CSS</option>

  <option value="python">Python</option>
  <option value="cpp">C++</option>
  <option value="java">Java</option>
  <option value="go">Go</option>
  <option value="rust">Rust</option>

  <option value="php">PHP</option>
  <option value="ruby">Ruby</option>
  <option value="shell">Bash</option>
</select>
        <button onClick={runCode}>Run</button>
        <button onClick={saveCode}>Save</button>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          value={templates[language] || `// Write your ${language} code here`}
        />
      </div>

      {/* Output */}
     <div
  id="output"
  style={{
    height: "160px",
    background: "#1e1e1e",
    color: "#ffffff",
    padding: "10px",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    overflow: "auto",
    borderTop: "2px solid #333"
  }}
>{output}</div>
    </div>
  );
}