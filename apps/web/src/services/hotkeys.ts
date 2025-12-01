type KeyBinding = {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    action: () => void;
    description: string;
};

type HotkeyCategory = 'edit' | 'file' | 'view' | 'navigation';

export class HotkeyManager {
    private bindings: Map<string, KeyBinding[]> = new Map();
    private enabled: boolean = true;

    constructor() {
        this.setupDefaultBindings();
        this.bindGlobalEvents();
    }

    private setupDefaultBindings(): void {
        // 编辑快捷键
        this.addBinding({
            key: 'b',
            ctrlKey: true,
            action: () => this.execCommand('bold'),
            description: '加粗'
        });

        this.addBinding({
            key: 'i',
            ctrlKey: true,
            action: () => this.execCommand('italic'),
            description: '斜体'
        });

        this.addBinding({
            key: '`',
            action: () => this.execCommand('code'),
            description: '行内代码'
        });

        this.addBinding({
            key: 'k',
            ctrlKey: true,
            action: () => this.insertLink(),
            description: '插入链接'
        });

        this.addBinding({
            key: 's',
            ctrlKey: true,
            action: () => this.saveDocument(),
            description: '保存文档'
        });

        // 文件操作
        this.addBinding({
            key: 'o',
            ctrlKey: true,
            action: () => this.openFile(),
            description: '打开文件'
        });

        this.addBinding({
            key: 'n',
            ctrlKey: true,
            action: () => this.newDocument(),
            description: '新建文档'
        });

        this.addBinding({
            key: 'e',
            ctrlKey: true,
            action: () => this.exportDocument(),
            description: '导出文档'
        });

        // 搜索和导航
        this.addBinding({
            key: 'f',
            ctrlKey: true,
            action: () => this.toggleSearch(),
            description: '搜索'
        });

        this.addBinding({
            key: 'g',
            ctrlKey: true,
            action: () => this.gotoLine(),
            description: '跳转到行'
        });

        this.addBinding({
            key: '/',
            action: () => this.toggleSearch(),
            description: '搜索'
        });

        // 查看操作
        this.addBinding({
            key: 'r',
            ctrlKey: true,
            action: () => this.copyToWechat(),
            description: '复制到微信'
        });

        this.addBinding({
            key: 'p',
            ctrlKey: true,
            shiftKey: true,
            action: () => this.printDocument(),
            description: '打印'
        });

        // 高级功能
        this.addBinding({
            key: 'z',
            ctrlKey: true,
            action: () => this.undo(),
            description: '撤销'
        });

        this.addBinding({
            key: 'y',
            ctrlKey: true,
            action: () => this.redo(),
            description: '重做'
        });
    }

    private addBinding(binding: KeyBinding): void {
        const key = this.getKeyString(binding);
        if (!this.bindings.has(key)) {
            this.bindings.set(key, []);
        }
        this.bindings.get(key)!.push(binding);
    }

    private getKeyString(binding: KeyBinding): string {
        const parts: string[] = [];
        if (binding.ctrlKey) parts.push('ctrl');
        if (binding.shiftKey) parts.push('shift');
        if (binding.altKey) parts.push('alt');
        if (binding.metaKey) parts.push('meta');
        parts.push(binding.key.toLowerCase());
        return parts.join('+');
    }

    private bindGlobalEvents(): void {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.enabled) return;

        const key = this.getKeyStringFromEvent(event);
        const bindings = this.bindings.get(key);

        if (bindings && bindings.length > 0) {
            event.preventDefault();
            event.stopPropagation();

            // 执行第一个匹配的快捷键
            bindings[0].action();
        }
    }

    private handleKeyUp(): void {
        // 可以在这里处理 keyup 事件
    }

    private getKeyStringFromEvent(event: KeyboardEvent): string {
        const parts: string[] = [];
        if (event.ctrlKey) parts.push('ctrl');
        if (event.shiftKey) parts.push('shift');
        if (event.altKey) parts.push('alt');
        if (event.metaKey) parts.push('meta');

        let key = event.key.toLowerCase();

        // 特殊键映射
        const keyMap: { [key: string]: string } = {
            ' ': 'space',
            'arrowup': 'up',
            'arrowdown': 'down',
            'arrowleft': 'left',
            'arrowright': 'right',
            'escape': 'esc'
        };

        if (keyMap[key]) {
            key = keyMap[key];
        }

        parts.push(key);
        return parts.join('+');
    }

    private execCommand(command: string, arg?: unknown): void {
        // 这里可以集成 CodeMirror 命令
        const customEvent = new CustomEvent('editorCommand', {
            detail: { command, arg }
        });
        document.dispatchEvent(customEvent);
    }

    private insertLink(): void {
        const selection = window.getSelection();
        if (selection && selection.toString()) {
            const link = prompt('请输入链接地址:', '');
            if (link) {
                this.execCommand('replaceSelectedText', `[${selection.toString()}](${link})`);
            }
        } else {
            const link = prompt('请输入链接地址:', '');
            if (link) {
                this.execCommand('insertText', `[](${link})`);
            }
        }
    }

    private saveDocument(): void {
        const customEvent = new CustomEvent('saveDocument');
        document.dispatchEvent(customEvent);
    }

    private openFile(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    const customEvent = new CustomEvent('loadDocument', {
                        detail: { content, filename: file.name }
                    });
                    document.dispatchEvent(customEvent);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    private newDocument(): void {
        const customEvent = new CustomEvent('newDocument');
        document.dispatchEvent(customEvent);
    }

    private exportDocument(): void {
        const customEvent = new CustomEvent('exportDocument');
        document.dispatchEvent(customEvent);
    }

    private toggleSearch(): void {
        const customEvent = new CustomEvent('toggleSearch');
        document.dispatchEvent(customEvent);
    }

    private gotoLine(): void {
        const lineNumber = prompt('请输入行号:', '');
        if (lineNumber) {
            this.execCommand('gotoLine', parseInt(lineNumber));
        }
    }

    private copyToWechat(): void {
        const customEvent = new CustomEvent('copyToWechat');
        document.dispatchEvent(customEvent);
    }

    private printDocument(): void {
        window.print();
    }

    private undo(): void {
        this.execCommand('undo');
    }

    private redo(): void {
        this.execCommand('redo');
    }

    // 公共方法
    public enable(): void {
        this.enabled = true;
    }

    public disable(): void {
        this.enabled = false;
    }

    public getBindingsByCategory(): { [category in HotkeyCategory]: KeyBinding[] } {
        const result: { [category in HotkeyCategory]: KeyBinding[] } = {
            edit: [],
            file: [],
            view: [],
            navigation: []
        };

        this.bindings.forEach((bindings, key) => {
            bindings.forEach(binding => {
                if (key.includes('b') || key.includes('i') || key.includes('k') || key.includes('z') || key.includes('y')) {
                    result.edit.push(binding);
                } else if (key.includes('s') || key.includes('o') || key.includes('n') || key.includes('e')) {
                    result.file.push(binding);
                } else if (key.includes('r') || key.includes('p')) {
                    result.view.push(binding);
                } else {
                    result.navigation.push(binding);
                }
            });
        });

        return result;
    }

    public getHotkeyHelp(): string {
        const categories = this.getBindingsByCategory();
        let help = '';

        help += '# 快捷键帮助\n\n';

        help += '## 编辑\n';
        categories.edit.forEach(binding => {
            const keys = this.formatKeyBinding(binding);
            help += `- ${keys}: ${binding.description}\n`;
        });

        help += '\n## 文件操作\n';
        categories.file.forEach(binding => {
            const keys = this.formatKeyBinding(binding);
            help += `- ${keys}: ${binding.description}\n`;
        });

        help += '\n## 搜索和导航\n';
        categories.navigation.forEach(binding => {
            const keys = this.formatKeyBinding(binding);
            help += `- ${keys}: ${binding.description}\n`;
        });

        help += '\n## 查看操作\n';
        categories.view.forEach(binding => {
            const keys = this.formatKeyBinding(binding);
            help += `- ${keys}: ${binding.description}\n`;
        });

        return help;
    }

    private formatKeyBinding(binding: KeyBinding): string {
        const parts: string[] = [];
        if (binding.ctrlKey) parts.push('Ctrl');
        if (binding.shiftKey) parts.push('Shift');
        if (binding.altKey) parts.push('Alt');
        if (binding.metaKey) parts.push('Cmd');
        parts.push(this.formatKeyName(binding.key));
        return parts.join(' + ');
    }

    private formatKeyName(key: string): string {
        const specialKeys: { [key: string]: string } = {
            ' ': 'Space',
            'escape': 'Esc',
            'enter': 'Enter',
            'tab': 'Tab',
            'backspace': 'Backspace',
            'delete': 'Delete',
            'home': 'Home',
            'end': 'End',
            'pageup': 'PageUp',
            'pagedown': 'PageDown',
            'arrowup': '↑',
            'arrowdown': '↓',
            'arrowleft': '←',
            'arrowright': '→'
        };
        return specialKeys[key.toLowerCase()] || key.toUpperCase();
    }

    public destroy(): void {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    }
}

// 单例
export const hotkeyManager = new HotkeyManager();