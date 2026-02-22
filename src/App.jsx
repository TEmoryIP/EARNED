import React, { useState, useEffect } from 'react';
import { DollarSign, PiggyBank, Calculator, TrendingUp, Save, Plus, X, BarChart3, Target, Edit2, Trash2, Check } from 'lucide-react';

export default function EarnedCalculator() {
  // View state
  const [view, setView] = useState('calculator');
  
  // Split system type
  const [splitType, setSplitType] = useState('percentage'); // 'percentage', 'dollar', 'cap', 'tiered'
  
  // Input state for calculator
  const [grossCommission, setGrossCommission] = useState('');
  
  // Percentage split
  const [brokerSplit, setBrokerSplit] = useState('70');
  
  // Dollar amount split
  const [brokerDollarAmount, setBrokerDollarAmount] = useState('500');
  
  // Cap system
  const [capPreSplit, setCapPreSplit] = useState('70'); // % you keep before cap
  const [capAmount, setCapAmount] = useState('16000'); // Amount you pay to broker before hitting cap
  const [capPostSplit, setCapPostSplit] = useState('95'); // % you keep after cap
  
  // Tiered system
  const [tiers, setTiers] = useState([
    { threshold: '0', split: '70', label: 'Tier 1' },
    { threshold: '16000', split: '95', label: 'Tier 2' }
  ]);
  
  const [transactionFee, setTransactionFee] = useState('395');
  const [transactionFeeType, setTransactionFeeType] = useState('flat');
  const [otherFees, setOtherFees] = useState('0');
  const [otherFeesType, setOtherFeesType] = useState('flat');
  
  // Saved brokerage profiles
  const [profiles, setProfiles] = useState([
    { 
      id: 1, 
      name: 'Traditional Brokerage',
      splitType: 'percentage',
      brokerSplit: '70',
      transFee: '395',
      transFeeType: 'flat',
      otherFees: '0',
      otherFeesType: 'flat'
    }
  ]);
  
  const [profileName, setProfileName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Comparison state
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  
  // Projection state
  const [projectionDeals, setProjectionDeals] = useState('24');
  const [projectionAvgCommission, setProjectionAvgCommission] = useState('8000');
  
  // Allocation percentages - now customizable!
  const [allocations, setAllocations] = useState([
    { id: 1, name: 'Owner Pay (Take Home)', percentage: 30, color: 'bg-green-500', icon: '💰' },
    { id: 2, name: 'Tax Reserve', percentage: 25, color: 'bg-red-500', icon: '🧾' },
    { id: 3, name: 'Operating Expenses', percentage: 15, color: 'bg-blue-500', icon: '💼' },
    { id: 4, name: 'Brokerage Fund', percentage: 10, color: 'bg-purple-500', icon: '🏢' },
    { id: 5, name: 'Home Build/Investment', percentage: 10, color: 'bg-orange-500', icon: '🏠' },
    { id: 6, name: 'Profit/Savings', percentage: 10, color: 'bg-blue-900', icon: '📈' }
  ]);
  
  const [editingAllocations, setEditingAllocations] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryPercentage, setNewCategoryPercentage] = useState('');

  // Calculate net commission based on split type
  const calculateNet = (gross, config) => {
    const grossAmount = parseFloat(gross) || 0;
    let agentPortion = 0;
    let brokerPortion = 0;
    
    // Determine split based on type
    switch(config.splitType) {
      case 'percentage':
        const splitPercent = parseFloat(config.brokerSplit) / 100;
        agentPortion = grossAmount * splitPercent;
        brokerPortion = grossAmount - agentPortion;
        break;
        
      case 'dollar':
        const dollarAmount = parseFloat(config.brokerDollarAmount) || 0;
        brokerPortion = Math.min(dollarAmount, grossAmount);
        agentPortion = grossAmount - brokerPortion;
        break;
        
      case 'cap':
        // For single transaction, assume pre-cap (actual cap tracking is in projections)
        const preSplitPercent = parseFloat(config.capPreSplit) / 100;
        agentPortion = grossAmount * preSplitPercent;
        brokerPortion = grossAmount - agentPortion;
        break;
        
      case 'tiered':
        // For single transaction, use first tier
        const firstTierSplit = parseFloat(config.tiers[0].split) / 100;
        agentPortion = grossAmount * firstTierSplit;
        brokerPortion = grossAmount - agentPortion;
        break;
        
      default:
        agentPortion = grossAmount * 0.7;
        brokerPortion = grossAmount * 0.3;
    }
    
    // Calculate transaction fee
    let transactionFeeAmount = 0;
    if (config.transFeeType === 'flat') {
      transactionFeeAmount = parseFloat(config.transFee) || 0;
    } else {
      transactionFeeAmount = agentPortion * (parseFloat(config.transFee) || 0) / 100;
    }
    
    // Calculate other fees
    let otherFeeAmount = 0;
    if (config.otherFeesType === 'flat') {
      otherFeeAmount = parseFloat(config.otherFees) || 0;
    } else {
      otherFeeAmount = agentPortion * (parseFloat(config.otherFees) || 0) / 100;
    }
    
    const netCommission = agentPortion - transactionFeeAmount - otherFeeAmount;
    
    return {
      gross: grossAmount,
      agentPortion,
      brokerPortion,
      transactionFee: transactionFeeAmount,
      otherFees: otherFeeAmount,
      totalFees: transactionFeeAmount + otherFeeAmount,
      net: Math.max(0, netCommission)
    };
  };

  // Calculate allocations
  const calculateAllocations = (netAmount) => {
    return allocations.map(alloc => ({
      ...alloc,
      amount: (netAmount * alloc.percentage) / 100
    }));
  };

  // Current commission calculation
  const currentConfig = {
    splitType,
    brokerSplit,
    brokerDollarAmount,
    capPreSplit,
    capAmount,
    capPostSplit,
    tiers,
    transFee: transactionFee,
    transFeeType: transactionFeeType,
    otherFees: otherFees,
    otherFeesType: otherFeesType
  };

  const commission = calculateNet(grossCommission, currentConfig);
  const breakdown = calculateAllocations(commission.net);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Save profile
  const saveProfile = () => {
    if (!profileName.trim()) return;
    
    const newProfile = {
      id: Date.now(),
      name: profileName,
      splitType,
      brokerSplit,
      brokerDollarAmount,
      capPreSplit,
      capAmount,
      capPostSplit,
      tiers: [...tiers],
      transFee: transactionFee,
      transFeeType: transactionFeeType,
      otherFees: otherFees,
      otherFeesType: otherFeesType
    };
    
    setProfiles([...profiles, newProfile]);
    setProfileName('');
    setShowSaveDialog(false);
  };

  // Load profile
  const loadProfile = (profile) => {
    setSplitType(profile.splitType);
    setBrokerSplit(profile.brokerSplit);
    setBrokerDollarAmount(profile.brokerDollarAmount || '500');
    setCapPreSplit(profile.capPreSplit || '70');
    setCapAmount(profile.capAmount || '16000');
    setCapPostSplit(profile.capPostSplit || '95');
    setTiers(profile.tiers || [{ threshold: '0', split: '70', label: 'Tier 1' }]);
    setTransactionFee(profile.transFee);
    setTransactionFeeType(profile.transFeeType);
    setOtherFees(profile.otherFees);
    setOtherFeesType(profile.otherFeesType);
  };

  // Delete profile
  const deleteProfile = (id) => {
    setProfiles(profiles.filter(p => p.id !== id));
  };

  // Allocation management
  const updateAllocationPercentage = (id, newPercentage) => {
    setAllocations(allocations.map(a => 
      a.id === id ? { ...a, percentage: parseFloat(newPercentage) || 0 } : a
    ));
  };

  const updateAllocationName = (id, newName) => {
    setAllocations(allocations.map(a => 
      a.id === id ? { ...a, name: newName } : a
    ));
  };

  const deleteAllocation = (id) => {
    if (allocations.length <= 1) return; // Keep at least one
    setAllocations(allocations.filter(a => a.id !== id));
  };

  const addAllocation = () => {
    if (!newCategoryName.trim() || !newCategoryPercentage) return;
    
    const newAllocation = {
      id: Date.now(),
      name: newCategoryName,
      percentage: parseFloat(newCategoryPercentage) || 0,
      color: 'bg-indigo-500',
      icon: '📊'
    };
    
    setAllocations([...allocations, newAllocation]);
    setNewCategoryName('');
    setNewCategoryPercentage('');
  };

  const totalAllocationPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);

  // Add tier
  const addTier = () => {
    setTiers([...tiers, { 
      threshold: '0', 
      split: '70', 
      label: `Tier ${tiers.length + 1}` 
    }]);
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...tiers];
    newTiers[index][field] = value;
    setTiers(newTiers);
  };

  const deleteTier = (index) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-blue-900-400">E</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 bg-clip-text text-transparent">
              EARNED
            </h1>
          </div>
          <p className="text-xl text-gray-700 font-medium">Financial Control for Commission Professionals</p>
          <p className="text-sm text-gray-500 mt-2">Master your variable income with smart allocation planning</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <button
            onClick={() => setView('calculator')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              view === 'calculator'
                ? 'bg-blue-900 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calculator className="w-5 h-5" />
            Calculator
          </button>
          <button
            onClick={() => setView('comparison')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              view === 'comparison'
                ? 'bg-blue-900 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Compare Brokerages
          </button>
          <button
            onClick={() => setView('projection')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              view === 'projection'
                ? 'bg-blue-900 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Target className="w-5 h-5" />
            Annual Projection
          </button>
        </div>

        {/* Calculator View */}
        {view === 'calculator' && (
          <CalculatorView
            grossCommission={grossCommission}
            setGrossCommission={setGrossCommission}
            splitType={splitType}
            setSplitType={setSplitType}
            brokerSplit={brokerSplit}
            setBrokerSplit={setBrokerSplit}
            brokerDollarAmount={brokerDollarAmount}
            setBrokerDollarAmount={setBrokerDollarAmount}
            capPreSplit={capPreSplit}
            setCapPreSplit={setCapPreSplit}
            capAmount={capAmount}
            setCapAmount={setCapAmount}
            capPostSplit={capPostSplit}
            setCapPostSplit={setCapPostSplit}
            tiers={tiers}
            addTier={addTier}
            updateTier={updateTier}
            deleteTier={deleteTier}
            transactionFee={transactionFee}
            setTransactionFee={setTransactionFee}
            transactionFeeType={transactionFeeType}
            setTransactionFeeType={setTransactionFeeType}
            otherFees={otherFees}
            setOtherFees={setOtherFees}
            otherFeesType={otherFeesType}
            setOtherFeesType={setOtherFeesType}
            commission={commission}
            breakdown={breakdown}
            allocations={allocations}
            editingAllocations={editingAllocations}
            setEditingAllocations={setEditingAllocations}
            updateAllocationPercentage={updateAllocationPercentage}
            updateAllocationName={updateAllocationName}
            deleteAllocation={deleteAllocation}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            newCategoryPercentage={newCategoryPercentage}
            setNewCategoryPercentage={setNewCategoryPercentage}
            addAllocation={addAllocation}
            totalAllocationPercentage={totalAllocationPercentage}
            formatCurrency={formatCurrency}
            profiles={profiles}
            loadProfile={loadProfile}
            deleteProfile={deleteProfile}
            showSaveDialog={showSaveDialog}
            setShowSaveDialog={setShowSaveDialog}
            profileName={profileName}
            setProfileName={setProfileName}
            saveProfile={saveProfile}
          />
        )}

        {/* Comparison View */}
        {view === 'comparison' && (
          <ComparisonView
            profiles={profiles}
            selectedProfiles={selectedProfiles}
            setSelectedProfiles={setSelectedProfiles}
            grossCommission={grossCommission}
            setGrossCommission={setGrossCommission}
            calculateNet={calculateNet}
            calculateAllocations={calculateAllocations}
            allocations={allocations}
            formatCurrency={formatCurrency}
          />
        )}

        {/* Projection View */}
        {view === 'projection' && (
          <ProjectionView
            projectionDeals={projectionDeals}
            setProjectionDeals={setProjectionDeals}
            projectionAvgCommission={projectionAvgCommission}
            setProjectionAvgCommission={setProjectionAvgCommission}
            currentConfig={currentConfig}
            calculateNet={calculateNet}
            calculateAllocations={calculateAllocations}
            allocations={allocations}
            formatCurrency={formatCurrency}
            profiles={profiles}
            loadProfile={loadProfile}
          />
        )}
      </div>
    </div>
  );
}

// Calculator View Component
function CalculatorView({
  grossCommission, setGrossCommission,
  splitType, setSplitType,
  brokerSplit, setBrokerSplit,
  brokerDollarAmount, setBrokerDollarAmount,
  capPreSplit, setCapPreSplit,
  capAmount, setCapAmount,
  capPostSplit, setCapPostSplit,
  tiers, addTier, updateTier, deleteTier,
  transactionFee, setTransactionFee,
  transactionFeeType, setTransactionFeeType,
  otherFees, setOtherFees,
  otherFeesType, setOtherFeesType,
  commission, breakdown, allocations,
  editingAllocations, setEditingAllocations,
  updateAllocationPercentage, updateAllocationName,
  deleteAllocation, newCategoryName, setNewCategoryName,
  newCategoryPercentage, setNewCategoryPercentage,
  addAllocation, totalAllocationPercentage,
  formatCurrency, profiles, loadProfile, deleteProfile,
  showSaveDialog, setShowSaveDialog,
  profileName, setProfileName, saveProfile
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left Column - Inputs */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-900" />
            Commission Details
          </h2>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-900 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Save Profile
          </button>
        </div>

        {/* Saved Profiles */}
        {profiles.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Load Saved Profile
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {profiles.map(profile => (
                <div key={profile.id} className="flex items-center gap-2">
                  <button
                    onClick={() => loadProfile(profile)}
                    className="flex-1 text-left px-4 py-2 bg-gray-50 hover:bg-blue-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    {profile.name}
                  </button>
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Name
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g., My eXp Offer"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                className="flex-1 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Gross Commission */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gross Commission (Total)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={grossCommission}
              onChange={(e) => setGrossCommission(e.target.value)}
              placeholder="15000"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Split Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Split Structure
          </label>
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          >
            <option value="percentage">Percentage Split (e.g., 70/30)</option>
            <option value="dollar">Dollar Amount per Deal (e.g., $500/transaction)</option>
            <option value="cap">Cap System (split changes after cap)</option>
            <option value="tiered">Tiered System (multiple levels)</option>
          </select>
        </div>

        {/* Split Type Specific Inputs */}
        {splitType === 'percentage' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Split (% you keep)
            </label>
            <input
              type="number"
              value={brokerSplit}
              onChange={(e) => setBrokerSplit(e.target.value)}
              placeholder="70"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            />
          </div>
        )}

        {splitType === 'dollar' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Broker Gets ($ per transaction)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={brokerDollarAmount}
                onChange={(e) => setBrokerDollarAmount(e.target.value)}
                placeholder="500"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {splitType === 'cap' && (
          <div className="mb-4 space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">Cap System</p>
              <p className="text-xs text-blue-600 mt-1">Your split improves after paying the broker a set amount</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pre-Cap Split (% you keep)
              </label>
              <input
                type="number"
                value={capPreSplit}
                onChange={(e) => setCapPreSplit(e.target.value)}
                placeholder="70"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cap Amount (total you pay broker)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={capAmount}
                  onChange={(e) => setCapAmount(e.target.value)}
                  placeholder="16000"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Post-Cap Split (% you keep)
              </label>
              <input
                type="number"
                value={capPostSplit}
                onChange={(e) => setCapPostSplit(e.target.value)}
                placeholder="95"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>
        )}

        {splitType === 'tiered' && (
          <div className="mb-4 space-y-3">
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800 font-medium">Tiered System</p>
              <p className="text-xs text-purple-600 mt-1">Different splits at different production levels</p>
            </div>
            {tiers.map((tier, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    After ${tier.threshold} paid
                  </label>
                  <input
                    type="number"
                    value={tier.threshold}
                    onChange={(e) => updateTier(index, 'threshold', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    You keep %
                  </label>
                  <input
                    type="number"
                    value={tier.split}
                    onChange={(e) => updateTier(index, 'split', e.target.value)}
                    placeholder="70"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                {tiers.length > 1 && (
                  <button
                    onClick={() => deleteTier(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addTier}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-900 hover:text-blue-900"
            >
              + Add Tier
            </button>
          </div>
        )}

        {/* Transaction Fee */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Fee
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              {transactionFeeType === 'flat' && (
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              )}
              <input
                type="number"
                value={transactionFee}
                onChange={(e) => setTransactionFee(e.target.value)}
                placeholder={transactionFeeType === 'flat' ? '395' : '3'}
                className={`w-full ${transactionFeeType === 'flat' ? 'pl-10' : 'pl-4'} pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent`}
              />
              {transactionFeeType === 'percent' && (
                <span className="absolute right-3 top-3 text-gray-400">%</span>
              )}
            </div>
            <button
              onClick={() => setTransactionFeeType(transactionFeeType === 'flat' ? 'percent' : 'flat')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              {transactionFeeType === 'flat' ? '$' : '%'}
            </button>
          </div>
        </div>

        {/* Other Fees */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other Fees (E&O, Tech, etc.)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              {otherFeesType === 'flat' && (
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              )}
              <input
                type="number"
                value={otherFees}
                onChange={(e) => setOtherFees(e.target.value)}
                placeholder={otherFeesType === 'flat' ? '0' : '0'}
                className={`w-full ${otherFeesType === 'flat' ? 'pl-10' : 'pl-4'} pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent`}
              />
              {otherFeesType === 'percent' && (
                <span className="absolute right-3 top-3 text-gray-400">%</span>
              )}
            </div>
            <button
              onClick={() => setOtherFeesType(otherFeesType === 'flat' ? 'percent' : 'flat')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              {otherFeesType === 'flat' ? '$' : '%'}
            </button>
          </div>
        </div>

        {/* Net Commission Display */}
        <div className="bg-gradient-to-br from-blue-90 to-blue-70 rounded-xl p-5 border-2 border-blue-200">
          <div className="text-sm text-gray-600 mb-1">Your Net Commission</div>
          <div className="text-4xl font-bold text-blue-900 mb-4">
            {formatCurrency(commission.net)}
          </div>
          <div className="text-xs text-gray-600 space-y-2 border-t border-blue-200 pt-3">
            <div className="flex justify-between">
              <span>Gross commission:</span>
              <span className="font-semibold">{formatCurrency(commission.gross)}</span>
            </div>
            <div className="flex justify-between">
              <span>Your portion:</span>
              <span className="font-semibold">{formatCurrency(commission.agentPortion)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>- Broker portion:</span>
              <span className="font-semibold">{formatCurrency(commission.brokerPortion)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>- Transaction fee:</span>
              <span className="font-semibold">{formatCurrency(commission.transactionFee)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>- Other fees:</span>
              <span className="font-semibold">{formatCurrency(commission.otherFees)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-blue-200 text-base">
              <span>Net to allocate:</span>
              <span className="text-blue-900">{formatCurrency(commission.net)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Allocation Breakdown */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-blue-900" />
            Smart Allocation Plan
          </h2>
          <button
            onClick={() => setEditingAllocations(!editingAllocations)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <Edit2 className="w-4 h-4" />
            {editingAllocations ? 'Done' : 'Customize'}
          </button>
        </div>

        {!editingAllocations ? (
          // Display Mode
          <div className="space-y-3">
            {breakdown.map(item => (
              <AllocationItem
                key={item.id}
                label={item.name}
                percentage={item.percentage}
                amount={item.amount}
                color={item.color}
                icon={item.icon}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-4">
            {allocations.map((item, index) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateAllocationName(item.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  {allocations.length > 1 && (
                    <button
                      onClick={() => deleteAllocation(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.percentage}
                    onChange={(e) => updateAllocationPercentage(item.id, e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>
            ))}

            {/* Add New Category */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Add New Category</p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newCategoryPercentage}
                    onChange={(e) => setNewCategoryPercentage(e.target.value)}
                    placeholder="Percentage"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={addAllocation}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm mb-3">
            <span className="text-gray-600">Total Allocated:</span>
            <span className={`font-semibold text-lg ${
              totalAllocationPercentage === 100 ? 'text-blue-900' : 'text-red-600'
            }`}>
              {totalAllocationPercentage}%
            </span>
          </div>
          {totalAllocationPercentage !== 100 && (
            <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 mb-3">
              ⚠️ Total must equal 100%. Adjust your percentages.
            </div>
          )}
          <div className="text-xs text-gray-600 bg-blue-90 p-4 rounded-lg border border-blue-200">
            💡 <strong>Smart Money Tip:</strong> This allocation system helps you manage variable income by setting aside taxes and expenses FIRST before you see the money.
          </div>
        </div>
      </div>
    </div>
  );
}

// Comparison View Component
function ComparisonView({ profiles, selectedProfiles, setSelectedProfiles, grossCommission, setGrossCommission, calculateNet, calculateAllocations, allocations, formatCurrency }) {
  const toggleProfile = (profile) => {
    if (selectedProfiles.find(p => p.id === profile.id)) {
      setSelectedProfiles(selectedProfiles.filter(p => p.id !== profile.id));
    } else if (selectedProfiles.length < 3) {
      setSelectedProfiles([...selectedProfiles, profile]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gross Commission Input */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Commission Amount to Compare
        </label>
        <div className="relative max-w-md">
          <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="number"
            value={grossCommission}
            onChange={(e) => setGrossCommission(e.target.value)}
            placeholder="15000"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
          />
        </div>
      </div>

      {/* Profile Selection */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Select Brokerages to Compare (up to 3)</h3>
        <div className="grid gap-3">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => toggleProfile(profile)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                selectedProfiles.find(p => p.id === profile.id)
                  ? 'border-blue-900 bg-blue-90'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800">{profile.name}</div>
              <div className="text-sm text-gray-500">
                {profile.splitType === 'percentage' && `${profile.brokerSplit}% split`}
                {profile.splitType === 'dollar' && `$${profile.brokerDollarAmount} per deal`}
                {profile.splitType === 'cap' && `${profile.capPreSplit}% → ${profile.capPostSplit}% (cap: $${profile.capAmount})`}
                {profile.splitType === 'tiered' && 'Tiered system'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Results */}
      {selectedProfiles.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {selectedProfiles.map(profile => {
            const result = calculateNet(grossCommission, profile);
            const allocationBreakdown = calculateAllocations(result.net);
            const ownerPay = allocationBreakdown.find(a => a.name.includes('Owner Pay'));

            return (
              <div key={profile.id} className="bg-white rounded-2xl shadow-xl p-6">
                <h4 className="font-bold text-lg text-gray-800 mb-4">{profile.name}</h4>
                
                <div className="bg-blue-90 rounded-lg p-4 mb-4 border-2 border-blue-200">
                  <div className="text-sm text-gray-600">Your Net</div>
                  <div className="text-3xl font-bold text-blue-900">{formatCurrency(result.net)}</div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross:</span>
                    <span className="font-medium">{formatCurrency(result.gross)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your portion:</span>
                    <span className="font-medium">{formatCurrency(result.agentPortion)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Broker cut:</span>
                    <span className="font-medium">{formatCurrency(result.brokerPortion)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Fees:</span>
                    <span className="font-medium">{formatCurrency(result.totalFees)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-600 font-semibold mb-2">You'd take home:</div>
                  <div className="text-lg font-bold text-green-600">
                    {ownerPay ? formatCurrency(ownerPay.amount) : formatCurrency(0)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProfiles.length === 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select brokerages above to compare</p>
        </div>
      )}
    </div>
  );
}

// Projection View Component
function ProjectionView({
  projectionDeals, setProjectionDeals,
  projectionAvgCommission, setProjectionAvgCommission,
  currentConfig, calculateNet, calculateAllocations, allocations,
  formatCurrency, profiles, loadProfile
}) {
  // Calculate cap details if using cap system
  const calculateCapProjection = () => {
    const deals = parseFloat(projectionDeals) || 0;
    const avgComm = parseFloat(projectionAvgCommission) || 0;
    
    if (currentConfig.splitType === 'cap') {
      const capAmt = parseFloat(currentConfig.capAmount) || 0;
      const preSplit = parseFloat(currentConfig.capPreSplit) / 100;
      const postSplit = parseFloat(currentConfig.capPostSplit) / 100;
      
      let totalNet = 0;
      let paidToBroker = 0;
      let dealsToCapt = 0;
      let hitCap = false;
      
      for (let i = 0; i < deals; i++) {
        const result = calculateNet(avgComm.toString(), currentConfig);
        
        if (!hitCap && paidToBroker + result.brokerPortion >= capAmt) {
          hitCap = true;
          dealsToCapt = i + 1;
          // This deal hits the cap
          const remainingToCap = capAmt - paidToBroker;
          const postCapPortion = result.brokerPortion - remainingToCap;
          const adjustedNet = result.net + postCapPortion * ((postSplit - preSplit) / (1 - preSplit));
          totalNet += adjustedNet;
          paidToBroker = capAmt;
        } else if (hitCap) {
          // Post-cap deals
          const postCapResult = calculateNet(avgComm.toString(), {
            ...currentConfig,
            splitType: 'percentage',
            brokerSplit: currentConfig.capPostSplit
          });
          totalNet += postCapResult.net;
        } else {
          // Pre-cap deals
          totalNet += result.net;
          paidToBroker += result.brokerPortion;
        }
      }
      
      return { totalNet, dealsToCapt, hitCap };
    }
    
    // Regular calculation for non-cap systems
    const perDeal = calculateNet(avgComm.toString(), currentConfig);
    const totalNet = perDeal.net * deals;
    return { totalNet, dealsToCapt: 0, hitCap: false };
  };

  const projection = calculateCapProjection();
  const totalGross = (parseFloat(projectionDeals) || 0) * (parseFloat(projectionAvgCommission) || 0);
  const annualAllocation = calculateAllocations(projection.totalNet);
  const ownerPayAllocation = annualAllocation.find(a => a.name.includes('Owner Pay'));

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-900" />
          Annual Income Projection
        </h3>

        {/* Load Profile Quick Select */}
        {profiles.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Use Saved Profile
            </label>
            <div className="flex flex-wrap gap-2">
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => loadProfile(profile)}
                  className="px-4 py-2 bg-gray-100 hover:bg-blue-90 rounded-lg text-sm font-medium transition-colors"
                >
                  {profile.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projected Deals per Year
            </label>
            <input
              type="number"
              value={projectionDeals}
              onChange={(e) => setProjectionDeals(e.target.value)}
              placeholder="24"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Average Commission per Deal
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={projectionAvgCommission}
                onChange={(e) => setProjectionAvgCommission(e.target.value)}
                placeholder="8000"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>
        </div>

        {/* Cap System Alert */}
        {currentConfig.splitType === 'cap' && projection.hitCap && (
          <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-800">🎉 You'll hit your cap!</p>
            <p className="text-xs text-blue-600 mt-1">
              After deal #{projection.dealsToCapt}, you'll be at {currentConfig.capPostSplit}% split.
              Remaining {parseFloat(projectionDeals) - projection.dealsToCapt} deals are at the higher split!
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Annual Gross */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-sm text-gray-600 mb-2">Annual Gross Commission (GCI)</div>
          <div className="text-3xl font-bold text-gray-800">{formatCurrency(totalGross)}</div>
          <div className="mt-4 text-xs text-gray-500">
            {projectionDeals} deals × {formatCurrency(parseFloat(projectionAvgCommission) || 0)}
          </div>
        </div>

        {/* Annual Net */}
        <div className="bg-gradient-to-br from-blue-90 to-blue-70 rounded-2xl shadow-xl p-6 border-2 border-blue-200">
          <div className="text-sm text-gray-600 mb-2">Annual Net Commission</div>
          <div className="text-3xl font-bold text-blue-900">{formatCurrency(projection.totalNet)}</div>
          <div className="mt-4 text-xs text-gray-600">
            After splits, fees & expenses
          </div>
        </div>

        {/* Take Home */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-sm text-gray-600 mb-2">Your Annual Take Home</div>
          <div className="text-3xl font-bold text-green-600">
            {ownerPayAllocation ? formatCurrency(ownerPayAllocation.amount) : formatCurrency(0)}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            {ownerPayAllocation ? `${ownerPayAllocation.percentage}%` : '0%'} of net (Owner Pay)
          </div>
        </div>
      </div>

      {/* Detailed Annual Breakdown */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h4 className="text-xl font-bold text-gray-800 mb-6">Your Money's Annual Plan</h4>
        
        <div className="grid md:grid-cols-2 gap-4">
          {annualAllocation.map(alloc => (
            <ProjectionItem
              key={alloc.id}
              label={`${alloc.icon} ${alloc.name}`}
              amount={alloc.amount}
              formatCurrency={formatCurrency}
              color="text-blue-900"
            />
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 bg-blue-90 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>💡 Reality Check:</strong> With {projectionDeals} deals at {formatCurrency(parseFloat(projectionAvgCommission) || 0)} average, 
            you'd take home <strong className="text-blue-900">
              {ownerPayAllocation ? formatCurrency(ownerPayAllocation.amount) : formatCurrency(0)}
            </strong> after 
            setting aside for taxes, expenses, and savings. 
            That's <strong className="text-blue-900">
              {ownerPayAllocation ? formatCurrency(ownerPayAllocation.amount / 12) : formatCurrency(0)}/month
            </strong> in predictable income.
          </p>
        </div>
      </div>
    </div>
  );
}

// Allocation Item Component
function AllocationItem({ label, percentage, amount, color, icon, formatCurrency }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="font-semibold text-gray-800">{label}</div>
          <div className="text-sm text-gray-500">{percentage}%</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-gray-900">{formatCurrency(amount)}</div>
        <div className="w-20 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${Math.min(percentage * 10, 100)}%` }}></div>
        </div>
      </div>
    </div>
  );
}

// Projection Item Component
function ProjectionItem({ label, amount, formatCurrency, color }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{formatCurrency(amount)}</div>
    </div>
  );
}
