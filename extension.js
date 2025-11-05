// The module 'vscode' contains the VS Code extensibility API

// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
let outputFormat = {
	"go": { "position": "below", "format": "fmt.Println(\"_var_:\", _var_)" },
	"java": { "position": "below", "format": "System.out.println(\"_var_: \" + _val_)" },
	"python": { "position": "below", "format": "print('_var_:', _var_)" },
	"javascript": { "position": "below", "format": "console.log('_var_:', _var_)" },
	"typescript": { "position": "below", "format": "console.log('_var_:', _var_)" },
	"typescript-react": { "position": "below", "format": "console.log('_var_:', _var_)" },
	"vue": { "position": "below", "format": "console.log('_var_:', _var_)" },
	"c": { "position": "below", "format": "printf(\"_var_: %d\\n\", _var_);" },
	"cpp": { "position": "below", "format": "std::cout << \"_var_: \" << _var_ << std::endl;" },
	"c#": { "position": "below", "format": "Console.WriteLine($\"_var_: {_var_}\");" },
	"ruby": { "position": "below", "format": "puts \"_var_: #{_var_}\"" },
	"php": { "position": "below", "format": "echo \"_var_: ${_var_}\";" },
	"swift": { "position": "below", "format": "print(\"_var_: {_var_}\")" },
	"kotlin": { "position": "below", "format": "println(\"_var_: {_var_}\")" },
	"scala": { "position": "below", "format": "println(s\"_var_: {_var_}\")" },
	"shell": { "position": "below", "format": "echo \"_var_: ${_var_}\"" },
	"bash": { "position": "below", "format": "echo \"_var_: ${_var_}\"" },
	"elm": { "position": "below", "format": "Debug.log(\"_var_: {_var_}\")" },
	"clojure": { "position": "below", "format": "(println \"_var_:\" _var_)" },
	"r": { "position": "below", "format": "cat(paste(\"_var_: \", _var_))" },
	"matlab": { "position": "below", "format": "disp([\"_var_: \", num2str(_var_)])" },
	"objective-c": { "position": "below", "format": "NSLog(@\"_var_: %d\", _var_);" },
	"vhdl": { "position": "below", "format": "report \"_var_: {_var_}\";" },
	"haskell": { "position": "below", "format": "putStrLn (\"_var_: \" ++ show _var_)" }
};

function updateConfig() {
	const config = vscode.workspace.getConfiguration("quickprint");
	outputFormat = Object.assign({}, outputFormat, config.get('outputFormat'));
	// console.log('Config Update:', outputFormat);
}
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	updateConfig()
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(updateConfig));
	context.subscriptions.push(
		vscode.commands.registerCommand('quickprint.printClipboardContent', async () => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				printthing(await vscode.env.clipboard.readText())
			}
		}),
		vscode.commands.registerCommand('quickprint.printWordOrSelectedText', async () => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				printthing(editor.selection.isEmpty ? getWordAtCursor(editor)
					: editor.document.getText(editor.selection));
			}
		})
	)
	for (let i = 1; i <= 5; i++) {
		context.subscriptions.push(
			vscode.commands.registerCommand(`quickprint.printCustom${i}`, async () => {
				const editor = vscode.window.activeTextEditor;
				if (editor) {
					printthing(
						editor.selection.isEmpty ? getWordAtCursor(editor) : editor.document.getText(editor.selection),
						`custom${i}`
					);
				}
			}))
	};
}

/**
 * @param {string} thing
 * @param {string} langId
*/
function printthing(thing, langId = '') {
	const editor = vscode.window.activeTextEditor;
	if (!editor || !thing) {
		return
	}
	if (!langId)
		langId = editor.document.languageId;
	const languageFormat = outputFormat[langId]
	// console.log("format", languageFormat);
	if (!languageFormat) {
		vscode.window.showWarningMessage(`The print format for ${langId} is not defined. Please configure it in the settings.`, "Open Settings")
			.then(openSettingsLabel => {
				if (openSettingsLabel === 'Open Settings') {
					// 打开 VSCode 的设置页面
					vscode.commands.executeCommand('workbench.action.openSettings', 'wuqzh8.quickprint');
				}
			});
		return
	}
	const position = languageFormat?.position || 'below'; // 默认位置
	const filepath = editor.document.fileName;
	const filename = path.basename(filepath);
	let line = editor.selection.active.line + 1; // 注意 VSCode 行号从 0 开始
	// if (position == 'below') line++;
	const format = languageFormat?.format || "print(_var_)";
	const restoreCursor = outputFormat.restoreCursor || true
	let printtext = format.replace(/_var_/g, thing)
	printtext = printtext.replace(/_line_/g, line)
	printtext = printtext.replace(/_filename_/g, filename)
	printtext = printtext.replace(/_filepath_/g, filepath)
	insertText(editor, printtext, position, restoreCursor)
}

/**
 * @param {vscode.TextEditor} editor
 * @param {string} text
 * @param {string} pos
 * @param {boolean} restoreCursor
*/
async function insertText(editor, text, pos = 'below', restoreCursor = false) {
	const originalPosition = editor.selection.active; // 获取光标的原始位置
	pos = pos || 'below'
	pos == 'below' ? await vscode.commands.executeCommand('editor.action.insertLineAfter')
		: await vscode.commands.executeCommand('editor.action.insertLineBefore');
	await editor.edit(editBuilder => {
		editBuilder.insert(editor.selection.active, text);
		// console.log('insert:', text);
	});
	// 如果需要恢复光标位置，并且是 'above'，需要将行号加 1
	if (restoreCursor) {
		if (pos === 'above') {
			// 如果是 'above'，光标位置应该加 1（因为插入在上一行）
			editor.selection = new vscode.Selection(originalPosition.line + 1, originalPosition.character, originalPosition.line + 1, originalPosition.character);
		} else {
			// 否则恢复原始光标位置
			editor.selection = new vscode.Selection(originalPosition, originalPosition);
		}
	}
}

/**
 * @param {vscode.TextEditor} editor
 * @param {string} text
*/
function insertText1(editor, text) {
	// vscode.commands.executeCommand('editor.action.insertLineAfter');
	const position = editor.selection.active; // 获取光标位置
	const newPosition = position.with(position.line + 1, 0); // 计算光标下一行的位置
	editor.edit(editBuilder => {
		editBuilder.insert(newPosition, text); // 插入文本
	}).then(() => {
		// console.log('insert:', text);
	});
}

/**
 * @param {vscode.TextEditor} editor
 * @returns {string|null} 返回光标位置的单词，或如果没有单词则返回 null
 */
function getWordAtCursor(editor) {
	const position = editor.selection.active;  // 获取光标位置
	const wordRange = editor.document.getWordRangeAtPosition(position); // 获取光标处的单词范围
	return wordRange ? editor.document.getText(wordRange) : null
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
