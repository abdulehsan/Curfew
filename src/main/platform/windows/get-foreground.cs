using System;
using System.Runtime.InteropServices;
using System.Text;

class Program {
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    static void Main() {
        IntPtr hwnd = GetForegroundWindow();
        if (hwnd == IntPtr.Zero) {
            Console.WriteLine("{\"pid\":0,\"title\":\"\"}");
            return;
        }
        uint pid = 0;
        GetWindowThreadProcessId(hwnd, out pid);
        StringBuilder sb = new StringBuilder(512);
        GetWindowText(hwnd, sb, 512);
        string title = sb.ToString()
            .Replace("\\", "\\\\")
            .Replace("\"", "\\\"")
            .Replace("\r", "")
            .Replace("\n", "");
        Console.WriteLine(string.Format("{{\"pid\":{0},\"title\":\"{1}\"}}", pid, title));
    }
}
