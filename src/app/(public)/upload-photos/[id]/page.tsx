'use client';

import { useState, useEffect, useCallback, use } from 'react';

type Photo = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  caption: string | null;
  photoType: string;
  uploadedBy: string | null;
  createdAt: string;
};

type QuotationInfo = {
  quotationNumber: string;
  projectName: string;
  customerName: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [quotation, setQuotation] = useState<QuotationInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedBy, setUploadedBy] = useState('');
  const [caption, setCaption] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string }[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotations/${id}/photos`);
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch { setPhotos([]); }
  }, [id]);

  const fetchQuotation = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotations/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setQuotation({
        quotationNumber: data.quotationNumber,
        projectName: data.projectName || '-',
        customerName: data.customerGroup?.groupName || '-',
      });
    } catch {
      setQuotation(null);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPhotos(), fetchQuotation()]).finally(() => setLoading(false));
  }, [fetchPhotos, fetchQuotation]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const previews = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPreviewFiles(prev => [...prev, ...previews]);
  };

  const removePreview = (index: number) => {
    setPreviewFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUpload = async () => {
    if (previewFiles.length === 0) return;
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      previewFiles.forEach(pf => formData.append('photos', pf.file));
      formData.append('photoType', 'BEFORE');
      if (uploadedBy) formData.append('uploadedBy', uploadedBy);
      if (caption) formData.append('caption', caption);

      const res = await fetch(`/api/quotations/${id}/photos`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      setMessage({ text: `อัพโหลดสำเร็จ ${previewFiles.length} รูป`, type: 'success' });
      previewFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
      setPreviewFiles([]);
      setCaption('');
      fetchPhotos();
    } catch {
      setMessage({ text: 'เกิดข้อผิดพลาดในการอัพโหลด', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('ต้องการลบรูปนี้?')) return;
    try {
      await fetch(`/api/quotations/${id}/photos?photoId=${photoId}`, { method: 'DELETE' });
      fetchPhotos();
    } catch { /* ignore */ }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      }}>
        <div style={{ textAlign: 'center', color: '#94A3B8' }}>
          <div style={{
            width: 48, height: 48, border: '3px solid #334155', borderTop: '3px solid #38BDF8',
            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px',
          }} />
          <p>กำลังโหลด...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#F1F5F9',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>ไม่พบใบเสนอราคา</h2>
          <p style={{ color: '#94A3B8' }}>ลิงก์อาจไม่ถูกต้อง หรือเอกสารถูกลบ</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      fontFamily: "'Inter', 'Sarabun', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.1)',
        padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #38BDF8, #0284C7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>📷</div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                แนบรูปภาพก่อนทำงาน
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                {quotation.quotationNumber} • {quotation.projectName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {/* Info Card */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: 16,
          padding: '20px 24px', marginBottom: 24,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>เลขที่ใบเสนอราคา</div>
              <div style={{ fontSize: 16, color: '#38BDF8', fontWeight: 700 }}>{quotation.quotationNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>ลูกค้า</div>
              <div style={{ fontSize: 14, color: '#E2E8F0', fontWeight: 500 }}>{quotation.customerName}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>ชื่อโครงการ/งาน</div>
              <div style={{ fontSize: 14, color: '#E2E8F0', fontWeight: 500 }}>{quotation.projectName}</div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: 16,
          padding: '24px', marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>📤</span>
            อัพโหลดรูปภาพ
          </h2>

          {/* Uploader Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
              ชื่อผู้ถ่ายรูป
            </label>
            <input
              type="text"
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
              placeholder="ระบุชื่อผู้ถ่ายรูป..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(100, 116, 139, 0.3)',
                color: '#F1F5F9', fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Caption */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
              คำอธิบาย (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="เช่น สภาพหน้างานก่อนทำงาน..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(100, 116, 139, 0.3)',
                color: '#F1F5F9', fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('photo-input')?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#38BDF8' : 'rgba(100, 116, 139, 0.3)'}`,
              borderRadius: 16, padding: '40px 20px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              background: dragOver ? 'rgba(56, 189, 248, 0.05)' : 'rgba(15, 23, 42, 0.3)',
              marginBottom: 16,
            }}
          >
            <input
              id="photo-input"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0', margin: '0 0 4px' }}>
              กดเพื่อเลือกรูป หรือลากไฟล์มาวางที่นี่
            </p>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              รองรับไฟล์ JPG, PNG, HEIC • ไม่จำกัดจำนวน
            </p>
          </div>

          {/* Preview Files */}
          {previewFiles.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>
                  เลือกแล้ว {previewFiles.length} รูป
                </span>
                <button
                  onClick={() => {
                    previewFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
                    setPreviewFiles([]);
                  }}
                  style={{
                    background: 'none', border: 'none', color: '#EF4444',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  ล้างทั้งหมด
                </button>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 12, marginBottom: 16,
              }}>
                {previewFiles.map((pf, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={pf.preview}
                      alt={pf.file.name}
                      style={{
                        width: '100%', height: 120, objectFit: 'cover',
                        borderRadius: 10, border: '1px solid rgba(100, 116, 139, 0.2)',
                      }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); removePreview(i); }}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.9)', border: 'none',
                        color: '#fff', fontSize: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >×</button>
                    <div style={{
                      fontSize: 10, color: '#94A3B8', marginTop: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {pf.file.name}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: uploading
                    ? 'linear-gradient(135deg, #475569, #334155)'
                    : 'linear-gradient(135deg, #22C55E, #16A34A)',
                  border: 'none', color: '#fff', fontSize: 16, fontWeight: 700,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  boxShadow: uploading ? 'none' : '0 4px 14px rgba(34, 197, 94, 0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {uploading ? '⏳ กำลังอัพโหลด...' : `📤 อัพโหลด ${previewFiles.length} รูป`}
              </button>
            </div>
          )}

          {/* Message */}
          {message && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 10,
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: message.type === 'success' ? '#4ADE80' : '#F87171',
              fontSize: 14, fontWeight: 600,
            }}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </div>
          )}
        </div>

        {/* Uploaded Photos Gallery */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: 16,
          padding: '24px',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #38BDF8, #0284C7)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>🖼️</span>
            รูปภาพที่อัพโหลดแล้ว ({photos.length})
          </h2>

          {photos.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              color: '#64748B',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>🖼️</div>
              <p style={{ fontSize: 14, fontWeight: 500 }}>ยังไม่มีรูปภาพ</p>
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
            }}>
              {photos.map((photo) => (
                <div key={photo.id} style={{
                  background: 'rgba(15, 23, 42, 0.5)', borderRadius: 12,
                  overflow: 'hidden', border: '1px solid rgba(100, 116, 139, 0.15)',
                }}>
                  <div
                    style={{ position: 'relative', cursor: 'pointer' }}
                    onClick={() => setLightbox(photo.fileUrl)}
                  >
                    <img
                      src={photo.fileUrl}
                      alt={photo.fileName}
                      style={{
                        width: '100%', height: 160, objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      background: photo.photoType === 'BEFORE'
                        ? 'rgba(56, 189, 248, 0.9)'
                        : 'rgba(34, 197, 94, 0.9)',
                      color: '#fff', fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 6,
                    }}>
                      {photo.photoType === 'BEFORE' ? 'ก่อนทำ' : 'หลังทำ'}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{
                      fontSize: 12, color: '#E2E8F0', fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: 4,
                    }}>
                      {photo.caption || photo.fileName}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#64748B' }}>
                        {photo.uploadedBy || '-'} • {formatFileSize(photo.fileSize)}
                      </span>
                      <button
                        onClick={() => handleDelete(photo.id)}
                        style={{
                          background: 'none', border: 'none',
                          color: '#EF4444', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                          padding: '2px 6px', borderRadius: 4,
                        }}
                      >
                        ลบ
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
                      {new Date(photo.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={lightbox}
            alt="Preview"
            style={{
              maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain',
              borderRadius: 8,
            }}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', fontSize: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>
      )}
    </div>
  );
}
