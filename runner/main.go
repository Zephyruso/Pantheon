//go:build windows
// +build windows

package main

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

const (
	MB_OK        = 0x00000000
	MB_ICONERROR = 0x00000010
)

var (
	user32Dll      = syscall.NewLazyDLL("user32.dll")
	messageBoxProc = user32Dll.NewProc("MessageBoxW")
	appTitle       = "Pantheon Runner"
	configFile     = "param.txt"
)

func main() {
	if err := executeProgram(); err != nil {
		displayError("error: " + err.Error())
	}
}

func executeProgram() error {
	if len(os.Args) != 2 {
		return errors.New("invalid arguments: need to provide program path")
	}

	targetProgram := os.Args[1]

	executablePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}

	executableDir := filepath.Dir(executablePath)
	configFilePath := filepath.Join(executableDir, configFile)

	configContent, err := readConfigFile(configFilePath)
	if err != nil {
		return fmt.Errorf("failed to read config file: %w", err)
	}

	if err := launchProgram(targetProgram, configContent); err != nil {
		return fmt.Errorf("failed to launch program: %w", err)
	}

	return nil
}

func readConfigFile(filePath string) (string, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", err
	}

	return strings.TrimSpace(string(content)), nil
}

func launchProgram(programPath, arguments string) error {
	cmd := exec.Command(programPath, arguments)

	if err := cmd.Start(); err != nil {
		errorMsg := fmt.Sprintf("Failed to start program: %s\n%s", programPath, err.Error())
		return errors.New(errorMsg)
	}

	return nil
}

func displayError(message string) {
	titlePtr, err := syscall.UTF16PtrFromString(appTitle)
	if err != nil {
		return
	}

	messagePtr, err := syscall.UTF16PtrFromString(message)
	if err != nil {
		return
	}

	messageBoxProc.Call(
		0, // 父窗口句柄
		uintptr(unsafe.Pointer(messagePtr)),
		uintptr(unsafe.Pointer(titlePtr)),
		uintptr(MB_OK|MB_ICONERROR),
	)
}
