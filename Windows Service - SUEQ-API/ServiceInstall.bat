@ECHO OFF
echo Install service SUEQ-API...
echo ----------------------------
sc create SUEQ-API binPath="C:\Projects\SUEQ-API\bin\Release\netcoreapp3.1\win-x86\SUEQ-API.exe"
echo ----------------------------
pause