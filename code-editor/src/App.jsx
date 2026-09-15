import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";

const backendBaseUrl =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:3000";

export default function App() {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("html");

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
  }

async function runCode() {
  const code = editorRef.current.getValue();
  const outputDiv = document.getElementById("output");
  const runEndpoint = `${backendBaseUrl}/run`;

  // 🔹 HTML → render
  if (language === "html") {
    outputDiv.innerHTML = code;
    return;
  }

  // 🔹 JS → run in browser
  if (language === "javascript") {
    try {
      const logs = [];
      const originalLog = console.log;

      console.log = (...args) => {
        logs.push(args.join(" "));
      };

      eval(code);

      console.log = originalLog;

      outputDiv.textContent = logs.join("\n") || "No output";
    } catch (err) {
      outputDiv.textContent = "Error: " + err.message;
    }
    return;
  }

  // 🔥 Backend languages
  let backendLang = language;
  if (language === "shell") backendLang = "bash";

  try {
    const res = await fetch(runEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code,
        language: backendLang
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      outputDiv.textContent = data.error || `Request failed with status ${res.status}`;
      return;
    }

    outputDiv.textContent =
      data.output ?? data.error ?? "No output";

  } catch (err) {
    outputDiv.textContent =
      "Error: unable to reach the code runner backend at http://localhost:3000/run. Start the Go server on port 3000 or set VITE_BACKEND_URL.";
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
    height: "250px", // Fixed height for output so it sits neatly at the bottom
    background: "#1e1e1e",
    color: "#ffffff",
    padding: "10px",
    fontFamily: "monospace",
    overflow: "auto",
    borderTop: "2px solid #333"
  }}
></div>
    </div>
  );
}