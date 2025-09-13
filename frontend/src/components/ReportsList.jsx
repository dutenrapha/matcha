import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/api';
import './ReportsList.css';

const ReportsList = () => {
  const { user } = useAuth();
  const [reportsMade, setReportsMade] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const loadReports = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError('');
      
      const reportsData = await reportService.getReportsMade(user.user_id);
      setReportsMade(reportsData);
      
    } catch (err) {
      console.error('Erro ao carregar reports:', err);
      setError('Erro ao carregar reports');
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDeleteReport = async (report) => {
    const confirmMessage = `Tem certeza que deseja remover o reporte de ${report.reported_name}?\n\nMotivo: ${report.reason}`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleting(report.report_id);
      await reportService.deleteReport(report.report_id);
      
      // Remover da lista local
      setReportsMade(prev => prev.filter(r => r.report_id !== report.report_id));
      
      alert('Reporte removido com sucesso!');
    } catch (err) {
      console.error('Erro ao remover reporte:', err);
      alert('Erro ao remover reporte. Tente novamente.');
    } finally {
      setDeleting(null);
    }
  };

  const formatReportDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReasonLabel = (reason) => {
    const reasonLabels = {
      'fake': 'Perfil Fake',
      'inappropriate': 'Conteúdo Inapropriado',
      'harassment': 'Assédio',
      'spam': 'Spam',
      'underage': 'Menor de Idade',
      'other': 'Outro'
    };
    return reasonLabels[reason] || reason;
  };

  if (loading) {
    return (
      <div className="reports-list">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-list">
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={loadReports} className="retry-btn">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-list">
      <div className="reports-header">
        <h2>📝 Meus Reports</h2>
        <p>{reportsMade.length} {reportsMade.length === 1 ? 'reporte enviado' : 'reports enviados'}</p>
      </div>

      {reportsMade.length === 0 ? (
        <div className="no-reports">
          <div className="no-reports-icon">✅</div>
          <h3>Nenhum reporte enviado</h3>
          <p>Você ainda não reportou nenhum usuário.</p>
          <div className="no-reports-info">
            <h4>ℹ️ Sobre reports:</h4>
            <ul>
              <li>Reports ajudam a manter a comunidade segura</li>
              <li>Nossa equipe analisa todos os reports</li>
              <li>Você pode remover seus reports a qualquer momento</li>
              <li>Reports falsos podem resultar em penalidades</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="reports-grid">
          {reportsMade.map((report) => (
            <div key={report.report_id} className="report-card">
              <div className="report-user-info">
                <img 
                  src={report.reported_avatar || 'https://via.placeholder.com/60x60/6b46c1/ffffff?text=Avatar'} 
                  alt={report.reported_name}
                  className="reported-user-avatar"
                />
                <div className="report-details">
                  <h3>{report.reported_name}</h3>
                  <p className="report-reason">
                    <span className="reason-label">Motivo:</span>
                    <span className="reason-value">{getReasonLabel(report.reason)}</span>
                  </p>
                  <p className="report-date">
                    Reportado em {formatReportDate(report.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="report-actions">
                <button 
                  className="delete-report-btn"
                  onClick={() => handleDeleteReport(report)}
                  disabled={deleting === report.report_id}
                >
                  {deleting === report.report_id ? '⏳ Removendo...' : '🗑️ Remover'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsList;
