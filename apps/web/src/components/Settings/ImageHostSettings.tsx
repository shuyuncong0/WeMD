/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Cloud, Zap, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import type { ImageHostConfig } from '../../services/image/ImageUploader';
import './ImageHostSettings.css';

interface AllConfigs {
    currentType: ImageHostConfig['type'];
    configs: {
        official?: any;
        qiniu?: any;
        aliyun?: any;
        tencent?: any;
        s3?: any;
    };
}

export function ImageHostSettings() {
    const [allConfigs, setAllConfigs] = useState<AllConfigs>(() => {
        const saved = localStorage.getItem('imageHostConfigs');
        return saved ? JSON.parse(saved) : { currentType: 'official', configs: {} };
    });

    // 当前查看的标签页（不等于激活的图床）
    const [viewingType, setViewingType] = useState<ImageHostConfig['type']>(allConfigs.currentType);
    const [testResult, setTestResult] = useState<string | null>(null);

    // 当前激活的图床类型
    const activeType = allConfigs.currentType;

    // 当前查看的配置
    const viewingConfig: ImageHostConfig = {
        type: viewingType,
        config: allConfigs.configs[viewingType]
    };

    useEffect(() => {
        // 保存所有配置
        localStorage.setItem('imageHostConfigs', JSON.stringify(allConfigs));
        // 同时保存当前配置到旧的 key，保持兼容性
        const currentConfig = { type: allConfigs.currentType, config: allConfigs.configs[allConfigs.currentType] };
        localStorage.setItem('imageHostConfig', JSON.stringify(currentConfig));
    }, [allConfigs]);

    // 切换查看的标签页（不改变激活状态）
    const handleTabChange = (type: ImageHostConfig['type']) => {
        setViewingType(type);
        setTestResult(null);
    };

    // 激活某个图床
    const handleActivate = async (type: ImageHostConfig['type']) => {
        // 官方图床无需验证，直接激活
        if (type === 'official') {
            setAllConfigs(prev => ({
                ...prev,
                currentType: type
            }));
            return;
        }

        // 其他图床需要验证连接
        const originalText = document.activeElement?.textContent;
        const btn = document.activeElement as HTMLButtonElement;

        if (btn) {
            btn.disabled = true;
            btn.textContent = '验证中...';
        }

        // 调用 ImageHostManager 验证配置
        try {
            const { ImageHostManager } = await import('../../services/image/ImageUploader');
            // 构造临时的配置对象用于验证
            const configToTest: ImageHostConfig = {
                type: type,
                config: allConfigs.configs[type]
            };

            const manager = new ImageHostManager(configToTest);
            const valid = await manager.validate();

            if (valid) {
                setAllConfigs(prev => ({
                    ...prev,
                    currentType: type
                }));
                setTestResult(null); // 成功切换清除之前的错误信息
            } else {
                setTestResult('❌ 无法启用：图床连接测试失败，请检查配置。');
                // 自动触发一次详细测试以显示具体错误
                if (testConnection) {
                    testConnection();
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setTestResult(`❌ 无法启用：验证过程出错 (${message})`);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = originalText || `启用${type === 'aliyun' ? '阿里云 OSS' : type === 'tencent' ? '腾讯云 COS' : type === 's3' ? 'S3 图床' : '七牛云图床'}`;
            }
        }
    };

    const handleConfigChange = (key: string, value: string) => {
        setAllConfigs(prev => ({
            ...prev,
            configs: {
                ...prev.configs,
                [viewingType]: {
                    ...prev.configs[viewingType],
                    [key]: value
                }
            }
        }));
    };

    const testConnection = async () => {
        setTestResult('测试中...');
        try {
            const { ImageHostManager } = await import('../../services/image/ImageUploader');
            const manager = new ImageHostManager(viewingConfig);
            const valid = await manager.validate();
            setTestResult(valid ? '✅ 配置有效' : '❌ 配置无效');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setTestResult(`❌ ${message}`);
        }
    };

    return (
        <div className="image-host-settings">
            {/* 顶部选项卡 */}
            <div className="host-tabs">
                <button
                    className={`host-tab ${viewingType === 'official' ? 'active' : ''}`}
                    onClick={() => handleTabChange('official')}
                >
                    官方图床
                    {activeType === 'official' && <span className="tab-active-badge">使用中</span>}
                </button>
                <button
                    className={`host-tab ${viewingType === 'qiniu' ? 'active' : ''}`}
                    onClick={() => handleTabChange('qiniu')}
                >
                    七牛云
                    {activeType === 'qiniu' && <span className="tab-active-badge">使用中</span>}
                </button>
                <button
                    className={`host-tab ${viewingType === 'aliyun' ? 'active' : ''}`}
                    onClick={() => handleTabChange('aliyun')}
                >
                    阿里云 OSS
                    {activeType === 'aliyun' && <span className="tab-active-badge">使用中</span>}
                </button>
                <button
                    className={`host-tab ${viewingType === 'tencent' ? 'active' : ''}`}
                    onClick={() => handleTabChange('tencent')}
                >
                    腾讯云 COS
                    {activeType === 'tencent' && <span className="tab-active-badge">使用中</span>}
                </button>
                <button
                    className={`host-tab ${viewingType === 's3' ? 'active' : ''}`}
                    onClick={() => handleTabChange('s3')}
                >
                    S3 兼容
                    {activeType === 's3' && <span className="tab-active-badge">使用中</span>}
                </button>
            </div>

            {/* 配置表单 */}
            <div className="host-config-panel">
                {viewingConfig.type === 'official' && (
                    <div className="official-host-intro">
                        <div className="intro-header">
                            <div className="intro-icon-wrapper">
                                <Cloud size={48} strokeWidth={1.5} className="primary-icon" />
                            </div>
                            <h3>官方托管服务</h3>
                            <p>专为公众号排版优化的图片托管方案</p>
                        </div>

                        <div className="feature-grid">
                            <div className="feature-item">
                                <div className="feature-icon"><Zap size={20} /></div>
                                <div className="feature-text">
                                    <strong>高速访问</strong>
                                    <span>基于全球边缘网络，加载流畅</span>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon"><ShieldCheck size={20} /></div>
                                <div className="feature-text">
                                    <strong>安全稳定</strong>
                                    <span>无需配置 Key，HTTPS 加密传输</span>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon"><ImageIcon size={20} /></div>
                                <div className="feature-text">
                                    <strong>开箱即用</strong>
                                    <span>默认集成，专注于内容创作</span>
                                </div>
                            </div>
                        </div>

                        {activeType === 'official' ? (
                            <div className="active-status">
                                <span className="pulsing-dot"></span>
                                <span>当前已启用官方图床</span>
                            </div>
                        ) : (
                            <button className="btn-activate" onClick={() => handleActivate('official')}>
                                启用官方图床
                            </button>
                        )}
                    </div>
                )}

                {viewingConfig.type === 'qiniu' && (
                    <div className="host-config">
                        {activeType === 'qiniu' && (
                            <div className="active-status">
                                <span className="pulsing-dot"></span>
                                <span>当前使用中</span>
                            </div>
                        )}
                        <div className="config-field">
                            <label>AccessKey</label>
                            <input
                                type="text"
                                placeholder="从七牛云控制台获取"
                                value={viewingConfig.config?.accessKey || ''}
                                onChange={(e) => handleConfigChange('accessKey', e.target.value)}
                            />
                        </div>
                        <div className="config-field">
                            <label>SecretKey</label>
                            <input
                                type="password"
                                placeholder="从七牛云控制台获取"
                                value={viewingConfig.config?.secretKey || ''}
                                onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                            />
                        </div>
                        <div className="config-field">
                            <label>存储空间名称（Bucket）</label>
                            <input
                                type="text"
                                placeholder="your-bucket"
                                value={viewingConfig.config?.bucket || ''}
                                onChange={(e) => handleConfigChange('bucket', e.target.value)}
                            />
                        </div>
                        <div className="config-field">
                            <label>存储区域</label>
                            <select
                                value={viewingConfig.config?.region || 'z0'}
                                onChange={(e) => handleConfigChange('region', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    color: '#1e293b',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="z0">华东-浙江 (z0)</option>
                                <option value="cn-east-2">华东-浙江2 (cn-east-2)</option>
                                <option value="z1">华北-河北 (z1)</option>
                                <option value="z2">华南-广东 (z2)</option>
                                <option value="na0">北美-洛杉矶 (na0)</option>
                                <option value="as0">亚太-新加坡 (as0)</option>
                                <option value="ap-northeast-1">亚太-首尔 (ap-northeast-1)</option>
                            </select>
                        </div>
                        <div className="config-field">
                            <label>CDN 域名</label>
                            <input
                                type="text"
                                placeholder="https://xxx.clouddn.com（七牛云测试域名需加 http://）"
                                value={viewingConfig.config?.domain || ''}
                                onChange={(e) => handleConfigChange('domain', e.target.value)}
                            />
                        </div>
                        <div className="config-footer">
                            <small>
                                <a href="https://portal.qiniu.com/kodo/bucket" target="_blank">七牛云控制台</a>
                            </small>
                            {testResult && <div className="test-result">{testResult}</div>}
                            <button onClick={testConnection}>测试连接</button>
                        </div>
                        {activeType !== 'qiniu' && (
                            <button className="btn-activate" onClick={() => handleActivate('qiniu')}>
                                启用七牛云图床
                            </button>
                        )}
                    </div>
                )}

                {viewingConfig.type === 'aliyun' && (
                    <div className="host-config">
                        {activeType === 'aliyun' && (
                            <div className="active-status">
                                <span className="pulsing-dot"></span>
                                <span>当前使用中</span>
                            </div>
                        )}
                        <div className="config-field">
                            <label>AccessKey ID</label>
                            <input
                                type="text"
                                placeholder="从阿里云控制台获取"
                                value={viewingConfig.config?.accessKeyId || ''}
                                onChange={(e) => handleConfigChange('accessKeyId', e.target.value)}
                            />
                        </div>
                        <div className="config-field">
                            <label>AccessKey Secret</label>
                            <input
                                type="password"
                                placeholder="从阿里云控制台获取"
                                value={viewingConfig.config?.accessKeySecret || ''}
                                onChange={(e) => handleConfigChange('accessKeySecret', e.target.value)}
                            />
                        </div>
                        <div className="config-field">
                            <label>Bucket 名称</label>
                            <input
                                type="text"
                                placeholder="your-bucket"
                                value={viewingConfig.config?.bucket || ''}
                                onChange={(e) => handleConfigChange('bucket', e.target.value)}
                            />
                        </div>
                        <div className="config-field">
                            <label>地域节点</label>
                            <input
                                type="text"
                                placeholder="oss-cn-hangzhou"
                                value={viewingConfig.config?.region || ''}
                                onChange={(e) => handleConfigChange('region', e.target.value)}
                            />
                            <small>例如：oss-cn-hangzhou（杭州）、oss-cn-beijing（北京）</small>
                        </div>
                        <div className="config-field">
                            <label>自定义域名（可选）</label>
                            <input
                                type="text"
                                placeholder="https://cdn.example.com"
                                value={viewingConfig.config?.endpoint || ''}
                                onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                            />
                        </div>
                        <div className="config-footer">
                            <small>
                                <a href="https://oss.console.aliyun.com/bucket" target="_blank">阿里云 OSS 控制台</a>
                            </small>
                            {testResult && <div className="test-result">{testResult}</div>}
                            <button onClick={testConnection}>测试连接</button>
                        </div>
                        {activeType !== 'aliyun' && (
                            <button className="btn-activate" onClick={() => handleActivate('aliyun')}>
                                启用阿里云 OSS
                            </button>
                        )}
                    </div>
                )}

                {viewingConfig.type === 'tencent' && (
                    <div className="host-config">
                        {activeType === 'tencent' && (
                            <div className="active-status">
                                <span className="pulsing-dot"></span>
                                <span>当前使用中</span>
                            </div>
                        )}
                        <div className="config-field">
                            <label>SecretId</label>
                            <input
                                type="text"
                                placeholder="从腾讯云控制台获取"
                                value={viewingConfig.config?.secretId || ''}
                                onChange={(e) => handleConfigChange('secretId', e.target.value)}
                            />
                        </div>
                        <div className="config-field">
                            <label>SecretKey</label>
                            <input
                                type="password"
                                placeholder="从腾讯云控制台获取"
                                value={viewingConfig.config?.secretKey || ''}
                                onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                            />
                        </div>
                        <div className="config-field">
                            <label>存储桶名称（Bucket）</label>
                            <input
                                type="text"
                                placeholder="your-bucket-1234567890"
                                value={viewingConfig.config?.bucket || ''}
                                onChange={(e) => handleConfigChange('bucket', e.target.value)}
                            />
                            <small>格式：bucketname-appid</small>
                        </div>
                        <div className="config-field">
                            <label>所属地域</label>
                            <input
                                type="text"
                                placeholder="ap-guangzhou"
                                value={viewingConfig.config?.region || ''}
                                onChange={(e) => handleConfigChange('region', e.target.value)}
                            />
                            <small>例如：ap-guangzhou（广州）、ap-beijing（北京）</small>
                        </div>
                        <div className="config-field">
                            <label>自定义域名（可选）</label>
                            <input
                                type="text"
                                placeholder="https://cdn.example.com"
                                value={viewingConfig.config?.endpoint || ''}
                                onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                            />
                        </div>
                        <div className="config-footer">
                            <small>
                                <a href="https://console.cloud.tencent.com/cos" target="_blank">腾讯云 COS 控制台</a>
                            </small>
                            {testResult && <div className="test-result">{testResult}</div>}
                            <button onClick={testConnection}>测试连接</button>
                        </div>
                        {activeType !== 'tencent' && (
                            <button className="btn-activate" onClick={() => handleActivate('tencent')}>
                                启用腾讯云 COS
                            </button>
                        )}
                    </div>
                )}

                {viewingConfig.type === 's3' && (
                    <div className="host-config">
                        {activeType === 's3' && (
                            <div className="active-status">
                                <span className="pulsing-dot"></span>
                                <span>当前使用中</span>
                            </div>
                        )}
                        <div className="config-field">
                            <label>Endpoint（必填）</label>
                            <input
                                type="text"
                                placeholder="https://s3.amazonaws.com 或 https://xxx.r2.cloudflarestorage.com"
                                value={viewingConfig.config?.endpoint || ''}
                                onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                            />
                            <small>S3 服务地址，不同服务商格式不同</small>
                        </div>
                        <div className="config-field">
                            <label>Region（必填）</label>
                            <input
                                type="text"
                                placeholder="us-east-1 或 auto"
                                value={viewingConfig.config?.region || ''}
                                onChange={(e) => handleConfigChange('region', e.target.value)}
                            />
                            <small>存储区域，Cloudflare R2 可填 auto</small>
                        </div>
                        <div className="config-field">
                            <label>Access Key ID（必填）</label>
                            <input
                                type="text"
                                placeholder="从服务商控制台获取"
                                value={viewingConfig.config?.accessKeyId || ''}
                                onChange={(e) => handleConfigChange('accessKeyId', e.target.value)}
                            />
                        </div>
                        <div className="config-field">
                            <label>Secret Access Key（必填）</label>
                            <input
                                type="password"
                                placeholder="从服务商控制台获取"
                                value={viewingConfig.config?.secretAccessKey || ''}
                                onChange={(e) => handleConfigChange('secretAccessKey', e.target.value)}
                            />
                        </div>
                        <div className="config-field">
                            <label>Bucket 名称（必填）</label>
                            <input
                                type="text"
                                placeholder="your-bucket"
                                value={viewingConfig.config?.bucket || ''}
                                onChange={(e) => handleConfigChange('bucket', e.target.value)}
                            />
                        </div>
                        <div className="config-field">
                            <label>路径前缀（可选）</label>
                            <input
                                type="text"
                                placeholder="images/wemd"
                                value={viewingConfig.config?.pathPrefix || ''}
                                onChange={(e) => handleConfigChange('pathPrefix', e.target.value)}
                            />
                            <small>图片存储的目录前缀</small>
                        </div>
                        <div className="config-field">
                            <label>自定义域名（可选）</label>
                            <input
                                type="text"
                                placeholder="https://cdn.example.com"
                                value={viewingConfig.config?.customDomain || ''}
                                onChange={(e) => handleConfigChange('customDomain', e.target.value)}
                            />
                            <small>用于访问图片的 CDN 或自定义域名</small>
                        </div>
                        <div className="config-field">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={viewingConfig.config?.forcePathStyle || false}
                                    onChange={(e) => handleConfigChange('forcePathStyle', e.target.checked ? 'true' : '')}
                                    style={{ width: 'auto', margin: 0 }}
                                />
                                <span>强制 Path Style</span>
                            </label>
                            <small>MinIO 等自建服务需要开启此选项</small>
                        </div>
                        <div className="config-footer">
                            {testResult && <div className="test-result">{testResult}</div>}
                            <button onClick={testConnection}>测试连接</button>
                        </div>
                        {activeType !== 's3' && (
                            <button className="btn-activate" onClick={() => handleActivate('s3')}>
                                启用 S3 图床
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

