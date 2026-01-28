import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requestApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import QueryEditor from '../../components/QueryEditor';
import ResultViewer from '../../components/ResultViewer';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ArrowLeft,
  Database,
  User,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const RequestDetail = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await requestApi.getById(id);
      setRequest(response.data);
    } catch (error) {
      console.error('Fetch request error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!request) {
    return (
      <div className="card text-center py-16">
        <h2 className="text-xl font-medium text-slate-300 mb-2">Request not found</h2>
        <Link to="/developer/requests" className="text-primary-400 hover:text-primary-300">
          Back to requests
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/developer/requests"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-100">{request.dbInstanceName}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-slate-400">Request ID: {request._id}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Timeline */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Status</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Submitted</p>
                <p className="text-xs text-slate-500">{formatDate(request.createdAt)}</p>
              </div>
            </div>

            <div className="flex-1 h-0.5 bg-slate-700" />

            {request.reviewedAt && (
              <>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    request.status === 'rejected' ? 'bg-red-500/20' : 'bg-emerald-500/20'
                  }`}>
                    {request.status === 'rejected' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      {request.status === 'rejected' ? 'Rejected' : 'Approved'}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(request.reviewedAt)}</p>
                  </div>
                </div>

                {request.executedAt && (
                  <>
                    <div className="flex-1 h-0.5 bg-slate-700" />
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        request.status === 'failed' ? 'bg-orange-500/20' : 'bg-emerald-500/20'
                      }`}>
                        {request.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Database className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-300">
                          {request.status === 'failed' ? 'Failed' : 'Executed'}
                        </p>
                        <p className="text-xs text-slate-500">{formatDate(request.executedAt)}</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Request Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Database</p>
                  <p className="text-slate-200">{request.dbInstanceName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Collection</p>
                  <p className="text-slate-200">{request.collectionName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Query Type</p>
                  <p className="text-slate-200 capitalize">{request.queryType}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Team Lead</p>
                  <p className="text-slate-200">{request.teamLeadName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Reason</p>
                  <p className="text-slate-200">{request.reason}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Query */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Query</h2>
          <QueryEditor value={request.query} readOnly height="200px" />
        </div>

        {/* Review Comment */}
        {request.reviewComment && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Review Comment</h2>
            <p className="text-slate-300">{request.reviewComment}</p>
          </div>
        )}

        {/* Results */}
        {(request.result || request.error) && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              {request.error ? 'Error' : 'Query Results'}
            </h2>
            <ResultViewer result={request.result} error={request.error} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetail;
