XCOPY dist\* "%USERPROFILE%\.vscode\extensions\rpgscript-vscode-linter\dist" /i /y
XCOPY linter\* "%USERPROFILE%\.vscode\extensions\rpgscript-vscode-linter\linter" /i /y
XCOPY . "%USERPROFILE%\.vscode\extensions\rpgscript-vscode-linter" /i /y
echo Install successful.
pause