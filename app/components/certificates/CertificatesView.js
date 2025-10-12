// app/components/certificates/CertificatesView.js
'use client';
import React, { useState, useContext, useEffect } from 'react';
import { Award } from 'lucide-react';
import { AppContext } from '@/app/page';
import { ToastContext } from '@/app/components/shared/ToastProvider';
import { api } from '@/lib/api';

export default function CertificatesView() {
  const { currentUser } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [progress, setProgress] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificatesData();
  }, [currentUser]);

  const loadCertificatesData = async () => {
    setLoading(true);
    try {
      const [progressData, certsData, profileData] = await Promise.all([
        api.getGradeProgress(currentUser.id),
        api.getCertificates(currentUser.id),
        api.getProfile(currentUser.id).catch(() => null)
      ]);
      
      setProgress(progressData);
      setCertificates(certsData);
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load certificates data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCertificate = async (certId) => {
    try {
      await api.approveCertificate({
        certificate_id: certId,
        trainer_id: currentUser.id
      });
      
      showToast('Certificate approved!', 'success');
      loadCertificatesData();
    } catch (error) {
      showToast(error.message || 'Failed to approve certificate', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading certificates...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#32303b]">Certificates</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {certificates.map(cert => (
          <CertificateCard key={cert.id} certificate={cert} profile={profile} />
        ))}
        
        {certificates.length === 0 && (
          <div className="col-span-2 bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-8 text-center text-gray-500">
            No certificates yet. Keep training to earn your first grade!
          </div>
        )}
      </div>

      {currentUser.role !== 'member' && (
        <TrainerCertificateApprovals onApprove={handleApproveCertificate} />
      )}
    </div>
  );
}

// ============= CERTIFICATE CARD =============
function CertificateCard({ certificate, profile }) {
  const statusColors = {
    pending: 'border-[#dcac6e] bg-[#dcac6e] bg-opacity-10',
    approved: 'border-green-300 bg-green-50'
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${statusColors[certificate.status]}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#32303b]">Grade {certificate.grade_number}</h3>
          <p className="text-sm text-gray-600">{profile?.dog_name || certificate.dog_name}</p>
        </div>
        <Award className={`w-8 h-8 ${certificate.status === 'approved' ? 'text-green-600' : 'text-[#dcac6e]'}`} />
      </div>
      
      <div className="space-y-2 text-sm">
        <p className="text-gray-600">
          Status: <span className="font-medium capitalize">{certificate.status}</span>
        </p>
        {certificate.approved_at && (
          <p className="text-gray-600">
            Approved: {new Date(certificate.approved_at).toLocaleDateString()}
          </p>
        )}
        {certificate.public_code && (
          <p className="text-gray-600">
            Certificate ID: <span className="font-mono font-bold">{certificate.public_code}</span>
          </p>
        )}
      </div>

      {certificate.status === 'approved' && (
        <button className="mt-4 w-full bg-[#32303b] text-white py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition">
          Download PDF
        </button>
      )}
    </div>
  );
}

// ============= TRAINER CERTIFICATE APPROVALS =============
function TrainerCertificateApprovals({ onApprove }) {
  const [pendingCerts, setPendingCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingCertificates();
  }, []);

  const loadPendingCertificates = async () => {
    setLoading(true);
    try {
      const data = await api.getCertificates(null, 'pending');
      setPendingCerts(data);
    } catch (error) {
      console.error('Failed to load pending certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || pendingCerts.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-[#dcac6e] p-6">
      <h3 className="text-xl font-bold text-[#32303b] mb-4">Pending Certificate Approvals</h3>
      <div className="space-y-4">
        {pendingCerts.map(cert => (
          <div key={cert.id} className="border-2 border-[#dcac6e] rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-[#32303b]">
                {cert.dog_name} - Grade {cert.grade_number}
              </p>
              <p className="text-sm text-gray-600">{cert.member_name}</p>
            </div>
            <button
              onClick={() => onApprove(cert.id)}
              className="bg-[#32303b] text-white px-4 py-2 rounded-lg hover:bg-[#dcac6e] hover:text-[#32303b] transition"
            >
              Approve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
