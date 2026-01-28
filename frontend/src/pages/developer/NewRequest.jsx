import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestApi, userApi, dbInstanceApi } from '../../services/api';
import QueryEditor from '../../components/QueryEditor';
import { Send, Database, User, FileText, Code } from 'lucide-react';
import toast from 'react-hot-toast';

const QUERY_TYPES = [
  { value: 'find', label: 'Find (Read)', description: 'Query documents' },
  { value: 'findOne', label: 'Find One (Read)', description: 'Get single document' },
  { value: 'aggregate', label: 'Aggregate (Read)', description: 'Run aggregation pipeline' },
  { value: 'count', label: 'Count (Read)', description: 'Count documents' },
  { value: 'distinct', label: 'Distinct (Read)', description: 'Get distinct values' },
  { value: 'insertOne', label: 'Insert One (Write)', description: 'Insert single document' },
  { value: 'insertMany', label: 'Insert Many (Write)', description: 'Insert multiple documents' },
  { value: 'updateOne', label: 'Update One (Write)', description: 'Update single document' },
  { value: 'updateMany', label: 'Update Many (Write)', description: 'Update multiple documents' },
  { value: 'deleteOne', label: 'Delete One (Write)', description: 'Delete single document' },
  { value: 'deleteMany', label: 'Delete Many (Write)', description: 'Delete multiple documents' },
];

const QUERY_TEMPLATES = {
  find: '{\n  "collection": "collectionName",\n  "filter": {},\n  "limit": 10,\n  "sort": { "_id": -1 }\n}',
  findOne: '{\n  "collection": "collectionName",\n  "filter": { "_id": "..." }\n}',
  aggregate: '{\n  "collection": "collectionName",\n  "pipeline": [\n    { "$match": {} },\n    { "$limit": 10 }\n  ]\n}',
  count: '{\n  "collection": "collectionName",\n  "filter": {}\n}',
  distinct: '{\n  "collection": "collectionName",\n  "field": "fieldName",\n  "filter": {}\n}',
  insertOne: '{\n  "collection": "collectionName",\n  "document": {\n    "field": "value"\n  }\n}',
  insertMany: '{\n  "collection": "collectionName",\n  "documents": [\n    { "field": "value1" },\n    { "field": "value2" }\n  ]\n}',
  updateOne: '{\n  "collection": "collectionName",\n  "filter": { "_id": "..." },\n  "update": { "$set": { "field": "newValue" } }\n}',
  updateMany: '{\n  "collection": "collectionName",\n  "filter": {},\n  "update": { "$set": { "field": "newValue" } }\n}',
  deleteOne: '{\n  "collection": "collectionName",\n  "filter": { "_id": "..." }\n}',
  deleteMany: '{\n  "collection": "collectionName",\n  "filter": {}\n}',
};

const NewRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dbInstances, setDbInstances] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);

  const [formData, setFormData] = useState({
    dbInstanceId: '',
    queryType: 'find',
    query: QUERY_TEMPLATES.find,
    reason: '',
    teamLeadId: '',
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [dbRes, leadsRes] = await Promise.all([
        dbInstanceApi.getAll({ activeOnly: 'true' }),
        userApi.getTeamLeads(),
      ]);
      console.log('DB Instances loaded:', dbRes.data);
      setDbInstances(dbRes.data);
      setTeamLeads(leadsRes.data);

      // Set default team lead if user has one assigned
      if (user?.teamLeadId) {
        setFormData(prev => ({ ...prev, teamLeadId: user.teamLeadId._id || user.teamLeadId }));
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
      toast.error('Failed to load form data');
    }
  };

  const handleQueryTypeChange = (e) => {
    const queryType = e.target.value;
    setFormData(prev => ({
      ...prev,
      queryType,
      query: QUERY_TEMPLATES[queryType] || '{}',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate JSON
    let parsedQuery;
    try {
      parsedQuery = JSON.parse(formData.query);
    } catch (error) {
      toast.error('Invalid JSON in query field');
      return;
    }

    // Check if collection is specified in query
    if (!parsedQuery.collection) {
      toast.error('Please specify "collection" in your query JSON');
      return;
    }

    if (!formData.dbInstanceId || !formData.reason || !formData.teamLeadId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await requestApi.create(formData);
      toast.success('Request submitted successfully!');
      navigate(`/developer/requests/${response.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">New Query Request</h1>
        <p className="text-slate-400 mt-1">Submit a query for team lead approval</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Developer Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-slate-200">Developer Information</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Name</label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="input bg-slate-800/80 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className="input bg-slate-800/80 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Database Selection */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-slate-200">Database Instance</h2>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Select Database <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.dbInstanceId}
              onChange={(e) => setFormData(prev => ({ ...prev, dbInstanceId: e.target.value }))}
              className="select"
              required
            >
              <option value="">Select database...</option>
              {dbInstances.map((db) => (
                <option key={db._id} value={db._id}>
                  {db.name} ({db.database})
                </option>
              ))}
            </select>
            {dbInstances.length === 0 && (
              <p className="text-xs text-amber-400 mt-2">
                No database instances available. Please contact an admin to add one.
              </p>
            )}
          </div>
        </div>

        {/* Query Details */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-slate-200">Query Details</h2>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">
              Query Type <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.queryType}
              onChange={handleQueryTypeChange}
              className="select"
              required
            >
              {QUERY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Query (JSON) <span className="text-red-400">*</span>
            </label>
            <QueryEditor
              value={formData.query}
              onChange={(value) => setFormData(prev => ({ ...prev, query: value }))}
              height="280px"
            />
            <p className="text-xs text-slate-500 mt-2">
              Include <code className="text-primary-400">"collection"</code> in your query to specify which collection to query.
            </p>
          </div>
        </div>

        {/* Reason & Approval */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-slate-200">Request Details</h2>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">
              Reason for Access <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Explain why you need to run this query..."
              className="textarea"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Team Lead <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.teamLeadId}
              onChange={(e) => setFormData(prev => ({ ...prev, teamLeadId: e.target.value }))}
              className="select"
              required
            >
              <option value="">Select team lead...</option>
              {teamLeads.map((lead) => (
                <option key={lead._id} value={lead._id}>
                  {lead.name} ({lead.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequest;
