using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Security.Principal;
using System.ServiceProcess;
using System.Windows.Forms;

namespace SUEQ_API_GUI_Settings
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        public static bool IsAdministrator()
        {
            return (new WindowsPrincipal(WindowsIdentity.GetCurrent()))
                      .IsInRole(WindowsBuiltInRole.Administrator);
        }

        private static string ServiceName = "SUEQ-API";
        private static string ServicePath = "C:/Projects/SUEQ-API/bin/Release/netcoreapp3.1/win-x86/SUEQ-API.exe";
        private static string SettingsPath = "C:/Projects/SUEQ-API/Properties/appsettings.json";

        private bool ServiceStatus()
        {
            try
            {
                ServiceController sc = new ServiceController(ServiceName);
                switch (sc.Status)
                {
                    case ServiceControllerStatus.StartPending:
                    case ServiceControllerStatus.Running:
                        label13.Text = "Включен";
                        label13.ForeColor = Color.Green;
                        button1.Enabled = false;
                        button2.Enabled = IsAdministrator();
                        return true;

                    case ServiceControllerStatus.Stopped:
                    case ServiceControllerStatus.Paused:
                    case ServiceControllerStatus.StopPending:
                    default:
                        label13.Text = "Выключен";
                        label13.ForeColor = Color.Maroon;
                        button1.Enabled = IsAdministrator();
                        button2.Enabled = false;
                        return false;
                }
            }
            catch
            {
                label13.Text = "Служба запуска не установлена";
                label13.ForeColor = Color.Gray;
                button1.Enabled = IsAdministrator();
                button2.Enabled = false;
            }
            return false;
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            if (IsAdministrator() == false)
            {
                MessageBox.Show("Нужно запустить эту программу от имени администратора для того, чтобы иметь возможность управлять сервером (запуск и остановка)!");
            }

            ServiceStatus();

            // Загрузка настроек из файла настроек
            string json = File.ReadAllText(SettingsPath);
            dynamic jsonObj = Newtonsoft.Json.JsonConvert.DeserializeObject(json);

            string UrlForLinks = jsonObj["UrlForLinks"];
            textBox1.Text = UrlForLinks.Substring(0, UrlForLinks.LastIndexOf(':'));

            numericUpDown1.Value = Convert.ToInt32(jsonObj["HttpPort"]);
            numericUpDown2.Value = Convert.ToInt32(jsonObj["HttpsPort"]);
            if (numericUpDown2.Value != 0)
            {
                radioButton2.PerformClick();
            }

            textBox2.Text = jsonObj["Certificate"]["PFX"];
            textBox3.Text = jsonObj["Certificate"]["Password"];

            textBox4.Text = jsonObj["GoogleCaptcha"]["PublicKey"];
            textBox5.Text = jsonObj["GoogleCaptcha"]["PrivateKey"];

            textBox6.Text = jsonObj["SMTP"]["Host"];
            numericUpDown3.Value = Convert.ToInt32(jsonObj["SMTP"]["Port"]);
            textBox7.Text = jsonObj["SMTP"]["Usermail"];
            textBox8.Text = jsonObj["SMTP"]["Password"];
            textBox9.Text = jsonObj["SMTP"]["Username"];

            textBox16.Text = jsonObj["Token"]["Issuer"];
            textBox15.Text = jsonObj["Token"]["Audience"];
            textBox14.Text = jsonObj["Token"]["Key"];
            numericUpDown6.Value = Convert.ToInt32(jsonObj["Token"]["AccessExpireMinutes"]);
            numericUpDown5.Value = Convert.ToInt32(jsonObj["Token"]["RefreshExpireMinutes"]);

            textBox10.Text = jsonObj["DataBase"]["Host"];
            numericUpDown4.Value = Convert.ToInt32(jsonObj["DataBase"]["Port"]);
            textBox11.Text = jsonObj["DataBase"]["Name"];
            textBox12.Text = jsonObj["DataBase"]["Password"];
            textBox13.Text = jsonObj["DataBase"]["User"];
        }

        private bool SaveSettings()
        {
            try
            {
                string json = File.ReadAllText(SettingsPath);
                dynamic jsonObj = Newtonsoft.Json.JsonConvert.DeserializeObject(json);

                jsonObj["UrlForLinks"] = $"{textBox1.Text}:{numericUpDown1.Value}";

                jsonObj["HttpPort"] = Convert.ToString(numericUpDown1.Value);
                jsonObj["HttpsPort"] = Convert.ToString(numericUpDown2.Value);

                jsonObj["Certificate"]["PFX"] = textBox2.Text;
                jsonObj["Certificate"]["Password"] = textBox3.Text;

                jsonObj["GoogleCaptcha"]["PublicKey"] = textBox4.Text;
                jsonObj["GoogleCaptcha"]["PrivateKey"] = textBox5.Text;

                jsonObj["SMTP"]["Host"] = textBox6.Text;
                jsonObj["SMTP"]["Port"] = Convert.ToString(numericUpDown3.Value);
                jsonObj["SMTP"]["Usermail"] = textBox7.Text;
                jsonObj["SMTP"]["Password"] = textBox8.Text;
                jsonObj["SMTP"]["Username"] = textBox9.Text;

                jsonObj["Token"]["Issuer"] = textBox16.Text;
                jsonObj["Token"]["Audience"] = textBox15.Text;
                jsonObj["Token"]["Key"] = textBox14.Text;
                jsonObj["Token"]["AccessExpireMinutes"] = Convert.ToString(numericUpDown6.Value);
                jsonObj["Token"]["RefreshExpireMinutes"] = Convert.ToString(numericUpDown5.Value);

                jsonObj["DataBase"]["Host"] = textBox10.Text;
                jsonObj["DataBase"]["Port"] = Convert.ToString(numericUpDown4.Value);
                jsonObj["DataBase"]["Name"] = textBox11.Text;
                jsonObj["DataBase"]["Password"] = textBox12.Text;
                jsonObj["DataBase"]["User"] = textBox13.Text;

                string output = Newtonsoft.Json.JsonConvert.SerializeObject(jsonObj, Newtonsoft.Json.Formatting.Indented);
                File.WriteAllText(SettingsPath, output);
            }
            catch
            {
                return false;
            }
            return true;
        }

        // Сохранить и выйти
        private void button6_Click(object sender, EventArgs e)
        {
            if (SaveSettings())
            {
                MessageBox.Show("Настройки будут применены после запуска/перезапуска сервера!");
                Close();
            }
            else
            {
                MessageBox.Show("Не удалось сохранить настройки!");
            }
        }

        private void radioButton2_CheckedChanged(object sender, EventArgs e)
        {
            radioButton1.ForeColor = Color.DarkGray;
            radioButton2.ForeColor = this.ForeColor;
            numericUpDown1.Enabled = false;
            numericUpDown2.Enabled = true;
        }

        private void radioButton1_CheckedChanged(object sender, EventArgs e)
        {
            radioButton1.ForeColor = this.ForeColor;
            radioButton2.ForeColor = Color.DarkGray;
            numericUpDown1.Enabled = true;
            numericUpDown2.Enabled = false;
            numericUpDown2.Value = 0; // Отключает https
        }

        private void button5_Click(object sender, EventArgs e)
        {
            if (openFileDialog1.ShowDialog() == DialogResult.OK)
            {
                textBox2.Text = openFileDialog1.FileName;
            }
        }

        public static bool InstallService(string exePath)
        {
            try
            {
                Process p = new Process();
                p.StartInfo.UseShellExecute = false;
                p.StartInfo.FileName = @"C:\Projects\SUEQ-API\Windows Service - SUEQ-API\ServiceInstall.bat";
                p.Start();
                p.WaitForExit();
            }
            catch
            {
                return false;
            }
            return true;
        }

        // Запустить
        private void button1_Click(object sender, EventArgs e)
        {
            if (SaveSettings() == false) MessageBox.Show("Не удалось сохранить настройки!");
            try
            {
                new ServiceController(ServiceName).Start();
            }
            catch
            {
                if (InstallService(ServicePath))
                {
                    new ServiceController(ServiceName).Start();
                }
            }
            ServiceStatus();
        }

        // Остановить
        private void button2_Click(object sender, EventArgs e)
        {
            if (ServiceStatus())
            {
                new ServiceController(ServiceName).Stop();
                ServiceStatus();
            }
        }

        private void radioButton2_Click(object sender, EventArgs e)
        {
            radioButton1.ForeColor = Color.DarkGray;
            radioButton2.ForeColor = this.ForeColor;
            numericUpDown1.Enabled = false;
            numericUpDown2.Enabled = true;
        }

        private void radioButton1_Click(object sender, EventArgs e)
        {
            radioButton1.ForeColor = this.ForeColor;
            radioButton2.ForeColor = Color.DarkGray;
            numericUpDown1.Enabled = true;
            numericUpDown2.Enabled = false;
            numericUpDown2.Value = 0; // Отключает https
        }
    }
}

/* Идеи для дополнения программы:
Кнопка генерации случайного ключа генерации в проверке токенов доступа
Конвертация срока жизни рядом с минутами в часах/днях/месяцах
Автопоиск доступных портов
*/