import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SignaturePad from '../components/SignaturePad';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ContractInfo {
  id: number;
  client_name: string;
  client_email: string;
  property_name: string;
  property_address: string;
  start_date: string | null;
  end_date: string | null;
  value: number;
  signed: boolean;
  has_licensee_signature: boolean;
  has_licensor_signature: boolean;
}

export default function PublicSign() {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSignPad, setShowSignPad] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE}/public/contract/${token}`)
      .then(res => { setContract(res.data); setLoading(false); })
      .catch((err) => {
        console.error('[PublicSign] Error loading contract:', err?.response?.status, err?.response?.data, err?.message);
        const detail = err?.response?.data?.detail || err?.message || 'Unknown error';
        setError(`Contract not found or invalid link. (${detail})`);
        setLoading(false);
      });
  }, [token]);

  const handleSave = async (dataUrl: string) => {
    if (!token) return;
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/public/contract/${token}`, { signature: dataUrl });
      setSuccess(true);
      setShowSignPad(false);
      // Refresh contract data
      const res = await axios.get(`${API_BASE}/public/contract/${token}`);
      setContract(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error saving signature. Please try again.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/public/contract/${token}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Licence_Agreement.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error downloading PDF');
    }
  };

  const fmt = (v: number) => v.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' });
  const fmtDate = (d: string | null) => {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('en-IE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Invalid Link</h1>
          <p className="text-gray-500">{error || 'This contract link is not valid or has expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-neutral-950 text-white py-6">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold">Ferri Sistem</h1>
          <p className="text-amber-400 text-sm mt-1">Licence Agreement - Digital Signing</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Contract Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Contract Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Licensee (You):</span>
              <p className="font-medium text-gray-800">{contract.client_name}</p>
            </div>
            <div>
              <span className="text-gray-500">Property:</span>
              <p className="font-medium text-gray-800">{contract.property_name}</p>
            </div>
            <div>
              <span className="text-gray-500">Address:</span>
              <p className="font-medium text-gray-800">{contract.property_address || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">Monthly Fee:</span>
              <p className="font-medium text-gray-800">{fmt(contract.value)}</p>
            </div>
            <div>
              <span className="text-gray-500">Start Date:</span>
              <p className="font-medium text-gray-800">{fmtDate(contract.start_date)}</p>
            </div>
            <div>
              <span className="text-gray-500">End Date:</span>
              <p className="font-medium text-gray-800">{fmtDate(contract.end_date)}</p>
            </div>
          </div>
        </div>

        {/* Download PDF */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Read the Full Agreement</h3>
              <p className="text-sm text-gray-500 mt-1">Please download and read the full licence agreement before signing.</p>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Signature Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Signature Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${contract.has_licensor_signature ? 'bg-green-500' : 'bg-gray-300'}`}>
                {contract.has_licensor_signature ? '✓' : '1'}
              </div>
              <div>
                <p className="font-medium text-gray-800">Licensor (Ferri Sistem)</p>
                <p className="text-xs text-gray-500">{contract.has_licensor_signature ? 'Signed' : 'Pending'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${contract.has_licensee_signature ? 'bg-green-500' : 'bg-gray-300'}`}>
                {contract.has_licensee_signature ? '✓' : '2'}
              </div>
              <div>
                <p className="font-medium text-gray-800">Licensee (You - {contract.client_name})</p>
                <p className="text-xs text-gray-500">{contract.has_licensee_signature ? 'Signed' : 'Awaiting your signature'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-green-500 text-4xl mb-2">✓</div>
            <h3 className="text-lg font-bold text-green-800">Contract Signed Successfully!</h3>
            <p className="text-sm text-green-600 mt-2">Your signature has been recorded. You can download the signed contract below.</p>
            <button
              onClick={handleDownloadPdf}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Download Signed Contract
            </button>
          </div>
        )}

        {/* Sign Button / Pad */}
        {!contract.has_licensee_signature && !success && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {!showSignPad ? (
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Ready to Sign?</h3>
                <p className="text-sm text-gray-500 mb-4">
                  By signing below, you agree to all terms and conditions outlined in the Licence Agreement.
                </p>
                <button
                  onClick={() => setShowSignPad(true)}
                  className="px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-lg"
                >
                  Sign Contract
                </button>
              </div>
            ) : (
              <div>
                <SignaturePad
                  label={`Signature - ${contract.client_name}`}
                  onSave={handleSave}
                  onCancel={() => setShowSignPad(false)}
                />
                {saving && (
                  <p className="text-sm text-amber-600 text-center mt-2">Saving your signature...</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Already signed */}
        {contract.has_licensee_signature && !success && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-bold text-amber-800">Contract Already Signed</h3>
            <p className="text-sm text-amber-600 mt-2">This contract has already been signed by you. You can download the signed version below.</p>
            <button
              onClick={handleDownloadPdf}
              className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
            >
              Download Signed Contract
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4">
          <p>Ferri Sistem | Property Management</p>
        </div>
      </div>
    </div>
  );
}
