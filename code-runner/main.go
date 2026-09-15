package main

import (
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Request struct {
	Code     string `json:"code"`
	Language string `json:"language"`
	Input    string `json:"input"`
}

func main() {
	r := gin.Default()
	r.Use(cors.Default()) // ✅ ADD THIS

	r.POST("/run", func(c *gin.Context) {
		var req Request

		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		output, err :=
			runCode(
				req.Code,
				req.Language,
				req.Input,
			)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, gin.H{"output": output})
	})

	r.Run(":3000")
}

func runCode(code string, lang string, input string) (string, error) {
	dir, err := os.MkdirTemp("", "kodeskuy-*")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(dir)
	mountDir := filepath.ToSlash(dir)

	var fileName string
	var dockerCmd []string

	switch lang {

	case "javascript":
		fileName = filepath.Join(dir, "code.js")
		if err := os.WriteFile(fileName, []byte(code), 0644); err != nil {
			return "", err
		}

		dockerCmd = []string{
			"run", "--rm",
			"-v", mountDir + ":/app",
			"-w", "/app",
			"node:18",
			"node", "code.js",
		}

	case "python":
		fileName = filepath.Join(dir, "code.py")
		if err := os.WriteFile(fileName, []byte(code), 0644); err != nil {
			return "", err
		}

		pyCmd := exec.Command("python", "-u", fileName)
		pyCmd.Stdin = strings.NewReader(input)
		out, err := pyCmd.CombinedOutput()
		if err != nil {
			return string(out) + "\nError: " + err.Error(), nil
		}

		return string(out), nil

	case "php":
		fileName = filepath.Join(dir, "code.php")
		if err := os.WriteFile(fileName, []byte(code), 0644); err != nil {
			return "", err
		}

		dockerCmd = []string{
			"run", "--rm",
			"-v", mountDir + ":/app",
			"-w", "/app",
			"php:8",
			"php", "code.php",
		}

	case "ruby":
		fileName = filepath.Join(dir, "code.rb")
		if err := os.WriteFile(fileName, []byte(code), 0644); err != nil {
			return "", err
		}

		dockerCmd = []string{
			"run", "--rm",
			"-v", mountDir + ":/app",
			"-w", "/app",
			"ruby:3",
			"ruby", "code.rb",
		}

	case "bash":
		fileName = filepath.Join(dir, "code.sh")
		if err := os.WriteFile(fileName, []byte(code), 0755); err != nil {
			return "", err
		}

		dockerCmd = []string{
			"run", "--rm",
			"-v", mountDir + ":/app",
			"-w", "/app",
			"alpine",
			"sh", "code.sh",
		}

	case "go":
		fileName = filepath.Join(dir, "main.go")
		if err := os.WriteFile(fileName, []byte(code), 0644); err != nil {
			return "", err
		}

		dockerCmd = []string{
			"run", "--rm",
			"-v", mountDir + ":/app",
			"-w", "/app",
			"golang:1.21",
			"go", "run", "main.go",
		}

	case "cpp":
		fileName = filepath.Join(dir, "main.cpp")
		if err := os.WriteFile(fileName, []byte(code), 0644); err != nil {
			return "", err
		}

		dockerCmd = []string{
			"run", "--rm",
			"-v", mountDir + ":/app",
			"-w", "/app",
			"gcc",
			"sh", "-c", "g++ main.cpp -o a && ./a",
		}

	case "java":
		fileName = filepath.Join(dir, "Main.java")
		if err := os.WriteFile(fileName, []byte(code), 0644); err != nil {
			return "", err
		}

		dockerCmd = []string{
			"run", "--rm",
			"-v", mountDir + ":/app",
			"-w", "/app",
			"openjdk:17",
			"sh", "-c", "javac Main.java && java Main",
		}

	case "rust":
		fileName = filepath.Join(dir, "main.rs")
		if err := os.WriteFile(fileName, []byte(code), 0644); err != nil {
			return "", err
		}

		dockerCmd = []string{
			"run", "--rm",
			"-v", mountDir + ":/app",
			"-w", "/app",
			"rust",
			"sh", "-c", "rustc main.rs -o a && ./a",
		}

	default:
		return "Unsupported language", nil
	}

	if fileName != "" {
		info, statErr := os.Stat(fileName)

		if statErr != nil {
			println("FILE NOT FOUND:", statErr.Error())
		} else {
			println("FILE EXISTS:")
			println("SIZE:", info.Size())
			println("PATH:", fileName)
		}
	}
	cmd := exec.Command("docker", dockerCmd...)
	cmd.Stdin = strings.NewReader(input)

	out, err := cmd.CombinedOutput()

	// 🔥 IMPORTANT: show real error
	if err != nil {
		return string(out) + "\nError: " + err.Error(), nil
	}

	return string(out), nil
}

func cleanupFiles() {
	files := []string{
		"temp.js", "temp.py", "temp.php", "temp.rb", "temp.sh",
		"temp.go", "temp.cpp", "temp.exe",
		"Main.java", "Main.class",
		"temp.rs", "temp_rust.exe",
	}

	for _, f := range files {
		os.Remove(f)
	}
}
