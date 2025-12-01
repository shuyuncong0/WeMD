import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Copy, Trash2, X, AlertTriangle } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useHistoryStore } from '../../store/historyStore';
import './ThemePanel.css';

interface ThemePanelProps {
  open: boolean;
  onClose: () => void;
}

export function ThemePanel({ open, onClose }: ThemePanelProps) {
  const theme = useEditorStore((state) => state.theme);
  const selectTheme = useEditorStore((state) => state.selectTheme);
  const createTheme = useEditorStore((state) => state.createTheme);
  const updateTheme = useEditorStore((state) => state.updateTheme);
  const deleteTheme = useEditorStore((state) => state.deleteTheme);
  const duplicateTheme = useEditorStore((state) => state.duplicateTheme);
  const getAllThemes = useEditorStore((state) => state.getAllThemes);
  const persistActiveSnapshot = useHistoryStore((state) => state.persistActiveSnapshot);
  const allThemes = useMemo(() => getAllThemes(), [getAllThemes]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [nameInput, setNameInput] = useState('');
  const [cssInput, setCssInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedTheme = allThemes.find((t) => t.id === selectedThemeId);
  const isCustomTheme = selectedTheme && !selectedTheme.isBuiltIn;

  useEffect(() => {
    if (open) {
      const currentTheme = allThemes.find((t) => t.id === theme);
      if (currentTheme) {
        setSelectedThemeId(currentTheme.id);
        setNameInput(currentTheme.name);
        setCssInput(currentTheme.css);
      }
      setIsCreating(false);
      setShowDeleteConfirm(false);
    }
  }, [open, theme, allThemes]);

  if (!open) return null;

  const handleSelectTheme = (themeId: string) => {
    const theme = allThemes.find((t) => t.id === themeId);
    if (!theme) return;

    setSelectedThemeId(themeId);
    setNameInput(theme.name);
    setCssInput(theme.css);
    setIsCreating(false);
    setShowDeleteConfirm(false);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedThemeId('');
    setNameInput('');
    setCssInput(selectedTheme?.css || '');
    setShowDeleteConfirm(false);
  };

  const handleApply = async () => {
    selectTheme(selectedThemeId);
    const state = useEditorStore.getState();
    await persistActiveSnapshot({
      markdown: state.markdown,
      theme: selectedThemeId,
      customCSS: '',
      themeName: selectedTheme?.name || '默认主题',
    });
    onClose();
  };

  const handleSave = async () => {
    if (isCreating) {
      // 创建新主题
      const newTheme = createTheme(nameInput, cssInput);
      selectTheme(newTheme.id);

      const state = useEditorStore.getState();
      await persistActiveSnapshot({
        markdown: state.markdown,
        theme: newTheme.id,
        customCSS: '',
        themeName: newTheme.name,
      });

      setSelectedThemeId(newTheme.id);
      setIsCreating(false);
    } else if (isCustomTheme) {
      // 更新现有主题
      updateTheme(selectedThemeId, {
        name: nameInput.trim() || '未命名主题',
        css: cssInput,
      });

      const state = useEditorStore.getState();
      if (state.theme === selectedThemeId) {
        await persistActiveSnapshot({
          markdown: state.markdown,
          theme: selectedThemeId,
          customCSS: '',
          themeName: nameInput.trim() || '未命名主题',
        });
      }
    }
  };

  const handleDeleteClick = () => {
    if (!isCustomTheme) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!isCustomTheme) return;

    deleteTheme(selectedThemeId);
    const defaultTheme = allThemes.find((t) => t.id === 'default');
    if (defaultTheme) {
      handleSelectTheme(defaultTheme.id);
    }
    setShowDeleteConfirm(false);
    toast.success('主题已删除');
  };

  const handleDuplicate = () => {
    if (!selectedTheme) return;
    const newName = `${selectedTheme.name} (副本)`;
    const duplicated = duplicateTheme(selectedThemeId, newName);
    handleSelectTheme(duplicated.id);
  };

  // Group themes
  const builtInThemes = allThemes.filter((t) => t.isBuiltIn);
  const customThemes = allThemes.filter((t) => !t.isBuiltIn);

  return (
    <div className="theme-overlay" onClick={onClose}>
      <div className="theme-modal" onClick={(e) => e.stopPropagation()}>
        <div className="theme-header">
          <h3>主题管理</h3>
          <button className="close-btn" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="theme-body">
          {/* 左侧主题列表 */}
          <div className="theme-sidebar">
            <button className="btn-new-theme" onClick={handleCreateNew}>
              <Plus size={16} /> 新建自定义主题
            </button>

            {customThemes.length > 0 && (
              <div className="theme-group">
                <div className="theme-group-title">自定义主题</div>
                {customThemes.map((item) => (
                  <button
                    key={item.id}
                    className={`theme-item ${item.id === selectedThemeId ? 'active' : ''}`}
                    onClick={() => handleSelectTheme(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}

            <div className="theme-group">
              <div className="theme-group-title">内置主题</div>
              {builtInThemes.map((item) => (
                <button
                  key={item.id}
                  className={`theme-item ${item.id === selectedThemeId ? 'active' : ''}`}
                  onClick={() => handleSelectTheme(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* 右侧编辑区 */}
          <div className="theme-editor" style={{ position: 'relative' }}>
            {showDeleteConfirm && (
              <div className="delete-confirm-overlay">
                <div className="delete-confirm-box">
                  <div className="confirm-icon-wrapper">
                    <AlertTriangle size={24} color="#ef4444" />
                  </div>
                  <h4>确认删除</h4>
                  <p>确定要删除主题 "{selectedTheme?.name}" 吗？此操作无法撤销。</p>
                  <div className="delete-confirm-actions">
                    <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                      取消
                    </button>
                    <button className="btn-primary" style={{ background: '#ef4444', boxShadow: 'none' }} onClick={handleConfirmDelete}>
                      确认删除
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="theme-form">
              <label>主题名称</label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="输入主题名称..."
                disabled={!isCreating && !isCustomTheme}
              />

              <label>CSS 样式</label>
              <textarea
                value={cssInput}
                onChange={(e) => setCssInput(e.target.value)}
                placeholder="输入 CSS 样式代码..."
                spellCheck={false}
                disabled={!isCreating && !isCustomTheme}
              />

              {!isCreating && !isCustomTheme && (
                <p className="info-hint">
                  💡 内置主题不可编辑，点击"复制"按钮可以基于此主题创建自定义主题
                </p>
              )}
            </div>

            <div className="theme-actions">
              {isCreating ? (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setIsCreating(false);
                      if (theme) {
                        handleSelectTheme(theme);
                      }
                    }}
                  >
                    取消
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={!nameInput.trim() || !cssInput.trim()}
                  >
                    保存新主题
                  </button>
                </>
              ) : isCustomTheme ? (
                <>
                  <button className="btn-icon-text" onClick={handleDuplicate}>
                    <Copy size={16} /> 复制
                  </button>
                  <button className="btn-icon-text btn-danger" onClick={handleDeleteClick}>
                    <Trash2 size={16} /> 删除
                  </button>
                  <div className="flex-spacer"></div>
                  <button className="btn-secondary" onClick={onClose}>
                    取消
                  </button>
                  <button className="btn-primary" onClick={handleSave}>
                    保存修改
                  </button>
                  <button className="btn-primary" onClick={handleApply}>
                    应用主题
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-icon-text" onClick={handleDuplicate}>
                    <Copy size={16} /> 复制
                  </button>
                  <div className="flex-spacer"></div>
                  <button className="btn-secondary" onClick={onClose}>
                    取消
                  </button>
                  <button className="btn-primary" onClick={handleApply}>
                    应用主题
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
