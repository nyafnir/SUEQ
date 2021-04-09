unit Unit1;

{$mode objfpc}{$H+}

interface

uses
  Classes, SysUtils, Forms, Controls, Graphics, Dialogs, ComCtrls, ExtCtrls,
  StdCtrls, Spin, EditBtn, Menus, LCLProc, strutils, LazUTF8;

type

  { TForm1 }

  TForm1 = class(TForm)
    CheckGroupSequelizeSettings: TCheckGroup;
    CheckGroupValidateSettings: TCheckGroup;
    GroupBox1: TGroupBox;
    GroupBox10: TGroupBox;
    GroupBox11: TGroupBox;
    GroupBox12: TGroupBox;
    GroupBox13: TGroupBox;
    GroupBox14: TGroupBox;
    GroupBox2: TGroupBox;
    GroupBox3: TGroupBox;
    GroupBox4: TGroupBox;
    GroupBox5: TGroupBox;
    GroupBox6: TGroupBox;
    GroupBox7: TGroupBox;
    GroupBox8: TGroupBox;
    GroupBox9: TGroupBox;
    Label1: TLabel;
    Label10: TLabel;
    Label11: TLabel;
    Label12: TLabel;
    Label13: TLabel;
    Label14: TLabel;
    Label15: TLabel;
    Label16: TLabel;
    Label17: TLabel;
    Label18: TLabel;
    Label19: TLabel;
    Label2: TLabel;
    Label20: TLabel;
    LabelSecurityLimitRateWindow: TLabel;
    LabelSecurityLimitSpeedDelayAfter: TLabel;
    LabelSecurityLimitSpeedDelay: TLabel;
    LabelDbPoolAcquire: TLabel;
    LabelDbPoolIdle: TLabel;
    Label26: TLabel;
    Label27: TLabel;
    Label28: TLabel;
    LabelTokensAccessLife: TLabel;
    Label3: TLabel;
    LabelTokensRefreshLife: TLabel;
    LabelPasswordResetLife: TLabel;
    LabelTokensEmailConfirmLife: TLabel;
    Label33: TLabel;
    LabelAccountRescueLife: TLabel;
    Label35: TLabel;
    LabelDbEventsEmailNotConfirm: TLabel;
    LabelDbEventsAccountNotRescue: TLabel;
    Label38: TLabel;
    Label4: TLabel;
    Label5: TLabel;
    Label6: TLabel;
    Label7: TLabel;
    Label8: TLabel;
    Label9: TLabel;
    LabeledEditTokensAccessSecret: TLabeledEdit;
    LabeledEditTokensRefreshSecret: TLabeledEdit;
    LabeledEditTokensPasswordResetSecret: TLabeledEdit;
    LabeledEditTokensEmailConfirmSecret: TLabeledEdit;
    LabeledEditAccountRescueSecret: TLabeledEdit;
    LabeledEditMailHost: TLabeledEdit;
    LabeledEditDbDialect: TLabeledEdit;
    LabeledEditMailPassword: TLabeledEdit;
    LabeledEditMailUser: TLabeledEdit;
    LabeledEditMailFrom: TLabeledEdit;
    LabeledEditMailSubject: TLabeledEdit;
    LabeledEditServerIp: TLabeledEdit;
    LabeledEditDbIp: TLabeledEdit;
    LabeledEditDbUser: TLabeledEdit;
    LabeledEditDbPassword: TLabeledEdit;
    LabeledEditDbName: TLabeledEdit;
    MainMenu1: TMainMenu;
    MenuItemManageStart: TMenuItem;
    MenuItem2: TMenuItem;
    MenuItemServiceUninstall: TMenuItem;
    MenuItemManageStop: TMenuItem;
    MenuItemManage: TMenuItem;
    MenuItemManageInstall: TMenuItem;
    MenuItemFile: TMenuItem;
    MenuItemFileOpen: TMenuItem;
    MenuItemFileSave: TMenuItem;
    PageControl1: TPageControl;
    ScrollBox1: TScrollBox;
    ScrollBox2: TScrollBox;
    ScrollBox3: TScrollBox;
    SpinEditTokensAccessLife: TSpinEdit;
    SpinEditTokensRefreshLife: TSpinEdit;
    SpinEditPasswordResetLife: TSpinEdit;
    SpinEditTokensEmailConfirmLife: TSpinEdit;
    SpinEditAccountRescueLife: TSpinEdit;
    SpinEditDbEventsEmailNotConfirm: TSpinEdit;
    SpinEditDbEventsAccountNotRescue: TSpinEdit;
    SpinEditSecurityLimitRateMaxRequests: TSpinEdit;
    SpinEditDbPoolAcquire: TSpinEdit;
    SpinEditDbPoolIdle: TSpinEdit;
    SpinEditSecurityLimitSpeedDelayAfter: TSpinEdit;
    SpinEditSecurityLimitSpeedDelay: TSpinEdit;
    SpinEditMailPort: TSpinEdit;
    SpinEditQueuesLimitsMember: TSpinEdit;
    SpinEditQueuesLimitsSchedules: TSpinEdit;
    SpinEditQueuesLimitsHolidays: TSpinEdit;
    SpinEditHashSaltRounds: TSpinEdit;
    SpinEditQueuesLimitsOwner: TSpinEdit;
    SpinEditDbPort: TSpinEdit;
    SpinEditSecurityLimitRateWindow: TSpinEdit;
    SpinEditSecurityLimitSpeedWindow: TSpinEdit;
    SpinEditDbPoolMax: TSpinEdit;
    SpinEditDbPoolMin: TSpinEdit;
    SpinEditServerPort: TSpinEdit;
    TabSheet1: TTabSheet;
    TabSheet2: TTabSheet;
    TabSheet3: TTabSheet;
    TabSheet4: TTabSheet;
    TabSheet5: TTabSheet;
    TabSheet6: TTabSheet;
    TabSheet7: TTabSheet;
    procedure FormShow(Sender: TObject);
    procedure MenuItemFileOpenClick(Sender: TObject);
    procedure MenuItemFileSaveClick(Sender: TObject);
    procedure MenuItemManageInstallClick(Sender: TObject);
    procedure MenuItemManageStartClick(Sender: TObject);
    procedure MenuItemManageStopClick(Sender: TObject);
    procedure MenuItemServiceUninstallClick(Sender: TObject);
    procedure SpinEditAccountRescueLifeChange(Sender: TObject);
    procedure SpinEditDbEventsAccountNotRescueChange(Sender: TObject);
    procedure SpinEditDbEventsEmailNotConfirmChange(Sender: TObject);
    procedure SpinEditDbPoolAcquireChange(Sender: TObject);
    procedure SpinEditDbPoolIdleChange(Sender: TObject);
    procedure SpinEditPasswordResetLifeChange(Sender: TObject);
    procedure SpinEditSecurityLimitRateWindowChange(Sender: TObject);
    procedure SpinEditSecurityLimitSpeedDelayAfterChange(Sender: TObject);
    procedure SpinEditSecurityLimitSpeedDelayChange(Sender: TObject);
    procedure SpinEditTokensAccessLifeChange(Sender: TObject);
    procedure SpinEditTokensEmailConfirmLifeChange(Sender: TObject);
    procedure SpinEditTokensRefreshLifeChange(Sender: TObject);
  private

  public

  end;

var
  Form1: TForm1;
  Memo1: TMemo;
  SettingsFileName: string = '.env';
  SequelizeSettings: TStringArray;
  ValidateSettings: TStringArray;
  HintDelimiter: String = #13#10;
  HintString: String;

implementation

{$R *.lfm}

{ TForm1 }

procedure TForm1.FormShow(Sender: TObject);
begin
  PageControl1.ActivePageIndex := 0;

  Memo1 := TMemo.Create(Self);
  Memo1.Parent := Self;
  Memo1.WordWrap := false;

  MenuItemFileOpenClick(Sender);
end;

procedure SelectAfterTextToEndLineInMemo(Memo: TMemo; SubStr: String);
var
  StartPos: integer = 0;
begin
  StartPos := PosEx(SubStr, Memo.Text) + Length(SubStr);
  Memo.SelStart := UTF8Length(PChar(Memo.Text), StartPos);
  Memo.SelLength := UTF8Length(Memo.Lines[Memo.CaretPos.Y]) - Length(SubStr) - 1;
end;

function GetSetting(Memo: TMemo; Name: String): String;
begin
  SelectAfterTextToEndLineInMemo(Memo, Name);
  Result := Memo.SelText;
end;

procedure SetSetting(Memo: TMemo; Name: String; NewValue: String);
begin
  SelectAfterTextToEndLineInMemo(Memo, Name);
  Memo.SelText := NewValue;
end;

procedure TForm1.MenuItemFileOpenClick(Sender: TObject);
begin
  if FileExists(SettingsFileName, true) then
    begin
      try
        Memo1.Visible := true;
        Memo1.Lines.LoadFromFile(SettingsFileName);
        Memo1.Visible := false;

        LabeledEditServerIp.Text := GetSetting(Memo1, LabeledEditServerIp.Hint);
        SpinEditServerPort.Value := StrToInt(GetSetting(Memo1, SpinEditServerPort.Hint));

        SpinEditSecurityLimitRateWindow.Value := StrToInt(GetSetting(Memo1, SpinEditSecurityLimitRateWindow.Hint));
        SpinEditSecurityLimitRateMaxRequests.Value := StrToInt(GetSetting(Memo1, SpinEditSecurityLimitRateMaxRequests.Hint));
        SpinEditSecurityLimitSpeedWindow.Value := StrToInt(GetSetting(Memo1, SpinEditSecurityLimitSpeedWindow.Hint));
        SpinEditSecurityLimitSpeedDelayAfter.Value := StrToInt(GetSetting(Memo1, SpinEditSecurityLimitSpeedDelayAfter.Hint));
        SpinEditSecurityLimitSpeedDelay.Value := StrToInt(GetSetting(Memo1, SpinEditSecurityLimitSpeedDelay.Hint));
        SpinEditHashSaltRounds.Value := StrToInt(GetSetting(Memo1, SpinEditHashSaltRounds.Hint));

        LabeledEditDbDialect.Text := GetSetting(Memo1, LabeledEditDbDialect.Hint);
        LabeledEditDbIp.Text := GetSetting(Memo1, LabeledEditDbIp.Hint);
        SpinEditDbPort.Value := StrToInt(GetSetting(Memo1, SpinEditDbPort.Hint));
        LabeledEditDbName.Text := GetSetting(Memo1, LabeledEditDbName.Hint);
        LabeledEditDbUser.Text := GetSetting(Memo1, LabeledEditDbUser.Hint);
        LabeledEditDbPassword.Text := GetSetting(Memo1, LabeledEditDbPassword.Hint);

        HintString := CheckGroupSequelizeSettings.Hint;
        SequelizeSettings := HintString.Split(HintDelimiter);
        CheckGroupSequelizeSettings.Checked[0] := StrToBool(GetSetting(Memo1, SequelizeSettings[0]));
        CheckGroupSequelizeSettings.Checked[1] := StrToBool(GetSetting(Memo1, SequelizeSettings[1]));
        CheckGroupSequelizeSettings.Checked[2] := StrToBool(GetSetting(Memo1, SequelizeSettings[2]));

        SpinEditDbPoolMax.Value := StrToInt(GetSetting(Memo1, SpinEditDbPoolMax.Hint));
        SpinEditDbPoolMin.Value := StrToInt(GetSetting(Memo1, SpinEditDbPoolMin.Hint));
        SpinEditDbPoolAcquire.Value := StrToInt(GetSetting(Memo1, SpinEditDbPoolAcquire.Hint));
        SpinEditDbPoolIdle.Value := StrToInt(GetSetting(Memo1, SpinEditDbPoolIdle.Hint));

        LabeledEditMailHost.Text := GetSetting(Memo1, LabeledEditMailHost.Hint);
        SpinEditMailPort.Value := StrToInt(GetSetting(Memo1, SpinEditMailPort.Hint));
        LabeledEditMailUser.Text := GetSetting(Memo1, LabeledEditMailUser.Hint);
        LabeledEditMailPassword.Text := GetSetting(Memo1, LabeledEditMailPassword.Hint);
        LabeledEditMailFrom.Text := GetSetting(Memo1, LabeledEditMailFrom.Hint);
        LabeledEditMailSubject.Text := GetSetting(Memo1, LabeledEditMailSubject.Hint);

        LabeledEditTokensAccessSecret.Text := GetSetting(Memo1, LabeledEditTokensAccessSecret.Hint);
        SpinEditTokensAccessLife.Value := StrToInt(GetSetting(Memo1, SpinEditTokensAccessLife.Hint));
        LabeledEditTokensRefreshSecret.Text := GetSetting(Memo1, LabeledEditTokensRefreshSecret.Hint);
        SpinEditTokensRefreshLife.Value := StrToInt(GetSetting(Memo1, SpinEditTokensRefreshLife.Hint));
        LabeledEditTokensEmailConfirmSecret.Text := GetSetting(Memo1, LabeledEditTokensEmailConfirmSecret.Hint);
        SpinEditTokensEmailConfirmLife.Value := StrToInt(GetSetting(Memo1, SpinEditTokensEmailConfirmLife.Hint));
        SpinEditDbEventsEmailNotConfirm.Value := StrToInt(GetSetting(Memo1, SpinEditDbEventsEmailNotConfirm.Hint));
        LabeledEditTokensPasswordResetSecret.Text := GetSetting(Memo1, LabeledEditTokensPasswordResetSecret.Hint);
        SpinEditPasswordResetLife.Value := StrToInt(GetSetting(Memo1, SpinEditPasswordResetLife.Hint));
        LabeledEditAccountRescueSecret.Text := GetSetting(Memo1, LabeledEditAccountRescueSecret.Hint);
        SpinEditAccountRescueLife.Value := StrToInt(GetSetting(Memo1, SpinEditAccountRescueLife.Hint));
        SpinEditDbEventsAccountNotRescue.Value := StrToInt(GetSetting(Memo1, SpinEditDbEventsAccountNotRescue.Hint));

        HintString := CheckGroupValidateSettings.Hint;
        ValidateSettings := HintString.Split(HintDelimiter);
        CheckGroupValidateSettings.Checked[0] := StrToBool(GetSetting(Memo1, ValidateSettings[0]));
        CheckGroupValidateSettings.Checked[1] := StrToBool(GetSetting(Memo1, ValidateSettings[1]));
        CheckGroupValidateSettings.Checked[2] := StrToBool(GetSetting(Memo1, ValidateSettings[2]));

        SpinEditQueuesLimitsOwner.Value := StrToInt(GetSetting(Memo1, SpinEditQueuesLimitsOwner.Hint));
        SpinEditQueuesLimitsMember.Value := StrToInt(GetSetting(Memo1, SpinEditQueuesLimitsMember.Hint));
        SpinEditQueuesLimitsSchedules.Value := StrToInt(GetSetting(Memo1, SpinEditQueuesLimitsSchedules.Hint));
        SpinEditQueuesLimitsHolidays.Value := StrToInt(GetSetting(Memo1, SpinEditQueuesLimitsHolidays.Hint));


        PageControl1.Enabled := true;
        MenuItemFileSave.Enabled := true;
      except
        begin
          ShowMessage(
            'Ошибка загрузки файла настроек!'
          );
        end;
      end;
    end
  else
    begin
      ShowMessage(
        'Файл настроек (' + SettingsFileName + ') не найден!'
      );
    end;
end;

function ConvertMSToTime(MS: Integer): String;
var
  seconds: integer = 0;
  minutes: integer = 0;
  hours: integer = 0;
  days: integer = 0;
  months: integer = 0;
  years: integer = 0;
  temp: integer = 0;
begin
  seconds := trunc(MS / 1000);

  temp := trunc(seconds / 31536000);
  if temp > 0 then
    begin
      years := temp;
      seconds := trunc(seconds - years * 31536000);
    end;

  temp := trunc(seconds / 2629743);
  if temp > 0 then
    begin
      months := temp;
      seconds := trunc(seconds - months * 2629743);
    end;

  temp := trunc(seconds / 86400);
  if temp > 0 then
    begin
      days := temp;
      seconds := trunc(seconds - days * 86400);
    end;

  temp := trunc(seconds / 3600);
  if temp > 0 then
    begin
      hours := temp;
      seconds := trunc(seconds - hours * 3600);
    end;

  temp := trunc(seconds / 60);
  if temp > 0 then
    begin
      minutes := temp;
      seconds := trunc(seconds - minutes * 60);
    end;

  Result := IntToStr(years) + ' г. ' + IntToStr(months) + ' мес. ' + IntToStr(days) + ' д. ' + #13
    + IntToStr(hours) + ' ч. ' + IntToStr(minutes) + ' мин. ' + IntToStr(seconds) + ' сек.';
end;

procedure TForm1.MenuItemFileSaveClick(Sender: TObject);
begin
  SetSetting(Memo1, LabeledEditServerIp.Hint, LabeledEditServerIp.Text);
  SetSetting(Memo1, SpinEditServerPort.Hint, IntToStr(SpinEditServerPort.Value));

  SetSetting(Memo1, SpinEditSecurityLimitRateWindow.Hint, IntToStr(SpinEditSecurityLimitRateWindow.Value));
  SetSetting(Memo1, SpinEditSecurityLimitRateMaxRequests.Hint, IntToStr(SpinEditSecurityLimitRateMaxRequests.Value));
  SetSetting(Memo1, SpinEditSecurityLimitSpeedWindow.Hint, IntToStr(SpinEditSecurityLimitSpeedWindow.Value));
  SetSetting(Memo1, SpinEditSecurityLimitSpeedDelayAfter.Hint, IntToStr(SpinEditSecurityLimitSpeedDelayAfter.Value));
  SetSetting(Memo1, SpinEditSecurityLimitSpeedDelay.Hint, IntToStr(SpinEditSecurityLimitSpeedDelay.Value));
  SetSetting(Memo1, SpinEditHashSaltRounds.Hint, IntToStr(SpinEditHashSaltRounds.Value));

  SetSetting(Memo1, LabeledEditDbDialect.Hint, LabeledEditDbDialect.Text);
  SetSetting(Memo1, LabeledEditDbIp.Hint, LabeledEditDbIp.Text);
  SetSetting(Memo1, SpinEditDbPort.Hint, IntToStr(SpinEditDbPort.Value));
  SetSetting(Memo1, LabeledEditDbName.Hint, LabeledEditDbName.Text);
  SetSetting(Memo1, LabeledEditDbUser.Hint, LabeledEditDbUser.Text);
  SetSetting(Memo1, LabeledEditDbPassword.Hint, LabeledEditDbPassword.Text);

  HintString := CheckGroupSequelizeSettings.Hint;
  SequelizeSettings := HintString.Split(HintDelimiter);
  SetSetting(Memo1, SequelizeSettings[0], BoolToStr(CheckGroupSequelizeSettings.Checked[0], 'true', 'false'));
  SetSetting(Memo1, SequelizeSettings[1], BoolToStr(CheckGroupSequelizeSettings.Checked[1], 'true', 'false'));
  SetSetting(Memo1, SequelizeSettings[2], BoolToStr(CheckGroupSequelizeSettings.Checked[2], 'true', 'false'));

  SetSetting(Memo1, SpinEditDbPoolMax.Hint, IntToStr(SpinEditDbPoolMax.Value));
  SetSetting(Memo1, SpinEditDbPoolMin.Hint, IntToStr(SpinEditDbPoolMin.Value));
  SetSetting(Memo1, SpinEditDbPoolAcquire.Hint, IntToStr(SpinEditDbPoolAcquire.Value));
  SetSetting(Memo1, SpinEditDbPoolIdle.Hint, IntToStr(SpinEditDbPoolIdle.Value));

  SetSetting(Memo1, LabeledEditMailHost.Hint, LabeledEditMailHost.Text);
  SetSetting(Memo1, SpinEditMailPort.Hint, IntToStr(SpinEditMailPort.Value));
  SetSetting(Memo1, LabeledEditMailUser.Hint, LabeledEditMailUser.Text);
  SetSetting(Memo1, LabeledEditMailPassword.Hint, LabeledEditMailPassword.Text);
  SetSetting(Memo1, LabeledEditMailFrom.Hint, LabeledEditMailFrom.Text);
  SetSetting(Memo1, LabeledEditMailSubject.Hint, LabeledEditMailSubject.Text);

  SetSetting(Memo1, LabeledEditTokensAccessSecret.Hint, LabeledEditTokensAccessSecret.Text);
  SetSetting(Memo1, SpinEditTokensAccessLife.Hint, IntToStr(SpinEditTokensAccessLife.Value));
  SetSetting(Memo1, LabeledEditTokensRefreshSecret.Hint, LabeledEditTokensRefreshSecret.Text);
  SetSetting(Memo1, SpinEditTokensRefreshLife.Hint, IntToStr(SpinEditTokensRefreshLife.Value));
  SetSetting(Memo1, LabeledEditTokensEmailConfirmSecret.Hint, LabeledEditTokensEmailConfirmSecret.Text);
  SetSetting(Memo1, SpinEditTokensEmailConfirmLife.Hint, IntToStr(SpinEditTokensEmailConfirmLife.Value));
  SetSetting(Memo1, SpinEditDbEventsEmailNotConfirm.Hint, IntToStr(SpinEditDbEventsEmailNotConfirm.Value));
  SetSetting(Memo1, LabeledEditTokensPasswordResetSecret.Hint, LabeledEditTokensPasswordResetSecret.Text);
  SetSetting(Memo1, SpinEditPasswordResetLife.Hint, IntToStr(SpinEditPasswordResetLife.Value));
  SetSetting(Memo1, LabeledEditAccountRescueSecret.Hint, LabeledEditAccountRescueSecret.Text);
  SetSetting(Memo1, SpinEditAccountRescueLife.Hint, IntToStr(SpinEditAccountRescueLife.Value));
  SetSetting(Memo1, SpinEditDbEventsAccountNotRescue.Hint, IntToStr(SpinEditDbEventsAccountNotRescue.Value));

  HintString := CheckGroupValidateSettings.Hint;
  ValidateSettings := HintString.Split(HintDelimiter);
  SetSetting(Memo1, ValidateSettings[0], BoolToStr(CheckGroupValidateSettings.Checked[0], 'true', 'false'));
  SetSetting(Memo1, ValidateSettings[1], BoolToStr(CheckGroupValidateSettings.Checked[1], 'true', 'false'));
  SetSetting(Memo1, ValidateSettings[2], BoolToStr(CheckGroupValidateSettings.Checked[2], 'true', 'false'));


  SetSetting(Memo1, SpinEditQueuesLimitsOwner.Hint, IntToStr(SpinEditQueuesLimitsOwner.Value));
  SetSetting(Memo1, SpinEditQueuesLimitsMember.Hint, IntToStr(SpinEditQueuesLimitsMember.Value));
  SetSetting(Memo1, SpinEditQueuesLimitsSchedules.Hint, IntToStr(SpinEditQueuesLimitsSchedules.Value));
  SetSetting(Memo1, SpinEditQueuesLimitsHolidays.Hint, IntToStr(SpinEditQueuesLimitsHolidays.Value));

  Memo1.Lines.SaveToFile(SettingsFileName);
end;

procedure TForm1.MenuItemManageInstallClick(Sender: TObject);
begin
   ExecuteProcess('cmd', '/c npm run install-windows-service & pause');
end;

procedure TForm1.MenuItemManageStartClick(Sender: TObject);
begin
   ExecuteProcess('cmd', '/c npm run start-windows-service & pause');
end;

procedure TForm1.MenuItemManageStopClick(Sender: TObject);
begin
  ExecuteProcess('cmd', '/c npm run stop-windows-service & pause');
end;

procedure TForm1.MenuItemServiceUninstallClick(Sender: TObject);
begin
  ExecuteProcess('cmd', '/c npm run uninstall-windows-service & pause');
end;

procedure TForm1.SpinEditAccountRescueLifeChange(Sender: TObject);
begin
  LabelAccountRescueLife.Caption := ConvertMSToTime(SpinEditAccountRescueLife.Value);
end;

procedure TForm1.SpinEditDbEventsAccountNotRescueChange(Sender: TObject);
begin
  LabelDbEventsAccountNotRescue.Caption := ConvertMSToTime(SpinEditDbEventsAccountNotRescue.Value);
end;

procedure TForm1.SpinEditDbEventsEmailNotConfirmChange(Sender: TObject);
begin
  LabelDbEventsEmailNotConfirm.Caption := ConvertMSToTime(SpinEditDbEventsEmailNotConfirm.Value);
end;

procedure TForm1.SpinEditDbPoolAcquireChange(Sender: TObject);
begin
  LabelDbPoolAcquire.Caption := ConvertMSToTime(SpinEditDbPoolAcquire.Value);
end;

procedure TForm1.SpinEditDbPoolIdleChange(Sender: TObject);
begin
  LabelDbPoolIdle.Caption := ConvertMSToTime(SpinEditDbPoolIdle.Value);
end;

procedure TForm1.SpinEditPasswordResetLifeChange(Sender: TObject);
begin
  LabelPasswordResetLife.Caption := ConvertMSToTime(SpinEditPasswordResetLife.Value);
end;

procedure TForm1.SpinEditSecurityLimitRateWindowChange(Sender: TObject);
begin
  LabelSecurityLimitRateWindow.Caption := ConvertMSToTime(SpinEditSecurityLimitRateWindow.Value);
end;

procedure TForm1.SpinEditSecurityLimitSpeedDelayAfterChange(Sender: TObject);
begin
  LabelSecurityLimitSpeedDelayAfter.Caption := ConvertMSToTime(SpinEditSecurityLimitSpeedDelayAfter.Value);
end;

procedure TForm1.SpinEditSecurityLimitSpeedDelayChange(Sender: TObject);
begin
  LabelSecurityLimitSpeedDelay.Caption := ConvertMSToTime(SpinEditSecurityLimitSpeedDelay.Value);
end;

procedure TForm1.SpinEditTokensAccessLifeChange(Sender: TObject);
begin
  LabelTokensAccessLife.Caption := ConvertMSToTime(SpinEditTokensAccessLife.Value);
end;

procedure TForm1.SpinEditTokensEmailConfirmLifeChange(Sender: TObject);
begin
  LabelTokensEmailConfirmLife.Caption := ConvertMSToTime(SpinEditTokensEmailConfirmLife.Value);
end;

procedure TForm1.SpinEditTokensRefreshLifeChange(Sender: TObject);
begin
  LabelTokensRefreshLife.Caption := ConvertMSToTime(SpinEditTokensRefreshLife.Value);
end;

end.

