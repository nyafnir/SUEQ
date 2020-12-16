@ECHO OFF
echo Delete service SUEQ-API...
echo ----------------------------
sc delete SUEQ-API binPath="C:\Projects\SUEQ-API\bin\Release\netcoreapp3.1\win-x86\SUEQ-API.exe"
echo ----------------------------
pause