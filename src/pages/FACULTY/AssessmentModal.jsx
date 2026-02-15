// src/components/faculty/AssessmentModal.jsx
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Award } from 'lucide-react';
import assessmentApi from "../../apis/assessments/assessment";

const AssessmentModal = ({ 
  course, 
  clos, 
  assessment, 
  marksRemaining, 
  onClose, 
  onSubmit,
  onMapClos,
  existingAssessments = [] // Add this prop with default empty array
}) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'CONTINUOUS',
    mode: 'WRITTEN',
    maxMarks: 0,
    weightage: 0,
    scheduledDate: new Date().toISOString().split('T')[0],
    description: '',
    subType: ''
  });
  
  const [cloAllocations, setCloAllocations] = useState([]);
  const [errors, setErrors] = useState({});
  const [maxMarksError, setMaxMarksError] = useState('');
  const [assessmentCountError, setAssessmentCountError] = useState(''); // New state for assessment count validation
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (assessment) {
      // Load assessment data for editing
      setFormData({
        title: assessment.title || '',
        type: assessment.type || 'CONTINUOUS',
        mode: assessment.mode || 'WRITTEN',
        maxMarks: assessment.maxMarks || 0,
        weightage: assessment.weightage || 0,
        scheduledDate: assessment.scheduledDate 
          ? new Date(assessment.scheduledDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        description: assessment.description || '',
        subType: assessment.subType || ''
      });
      
      // Load CLO allocations
      if (assessment.assessmentClos?.length > 0) {
        const allocations = (clos || []).map(clo => {
          const existing = assessment.assessmentClos.find(ac => ac.cloId === clo.id);
          return {
            cloId: clo.id,
            cloCode: clo.code,
            marksAllocated: existing?.marksAllocated ?? 0,
            bloomLevel: existing?.bloomLevel ?? clo.bloomLevel,
            weightage: existing?.weightage ?? 0,
            threshold: existing?.threshold ?? 50 // Add threshold
          };
        });
        setCloAllocations(allocations);
      } else {
        // Initialize with zero allocations if no CLOs mapped
        const allocations = clos.map(clo => ({
          cloId: clo.id,
          cloCode: clo.code,
          marksAllocated: 0,
          bloomLevel: clo.bloomLevel,
          weightage: 0,
          threshold: 50 // Default threshold
        }));
        setCloAllocations(allocations);
      }
    } else {
      // Initialize with zero allocations for new assessment
      const allocations = clos.map(clo => ({
        cloId: clo.id,
        cloCode: clo.code,
        marksAllocated: 0,
        bloomLevel: clo.bloomLevel,
        weightage: 0,
        threshold: 50 // Default threshold
      }));
      setCloAllocations(allocations);
      
      // Set default max marks
      if (marksRemaining > 0) {
        setFormData(prev => ({
          ...prev,
          maxMarks: Math.min(25, marksRemaining)
        }));
      }
    }
  }, [assessment, clos, marksRemaining]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate max marks when changed
    if (name === 'maxMarks') {
      validateMaxMarks(parseInt(value) || 0);
      // Clear assessment count error when user changes max marks
      setAssessmentCountError('');
    }
    
    // Adjust weightage based on max marks
    if (name === 'maxMarks') {
      const maxMarksVal = parseInt(value) || 0;
      const courseMaxMarks = (course?.credits || 0) * 25;
      if (courseMaxMarks > 0) {
        const weightage = Math.round((maxMarksVal / courseMaxMarks) * 100);
        setFormData(prev => ({ ...prev, weightage }));
      }
    }
  };

  const validateMaxMarks = (value) => {
    if (value > marksRemaining + (assessment?.maxMarks || 0)) {
      setMaxMarksError(`Cannot exceed ${marksRemaining + (assessment?.maxMarks || 0)} marks. ${marksRemaining} marks remaining.`);
      return false;
    }
    
    setMaxMarksError('');
    return true;
  };

  // New validation function to check if completing marks in minimum 3 assessments
  const validateAssessmentDistribution = (newAssessmentMarks) => {
    const courseTotalMarks = (course?.credits || 0) * 25;
    
    // Filter out current assessment if editing
    const otherAssessments = existingAssessments.filter(a => 
      !assessment || a.id !== assessment.id
    );
    
    const otherAssessmentsTotal = otherAssessments.reduce((sum, a) => sum + (a.maxMarks || 0), 0);
    const totalAfterAdding = otherAssessmentsTotal + newAssessmentMarks;
    
    // Check if this assessment would complete all marks
    const wouldCompleteAllMarks = totalAfterAdding === courseTotalMarks;
    
    // Count how many assessments would have marks after adding this one
    const assessmentsWithMarks = [...otherAssessments];
    if (newAssessmentMarks > 0) {
      assessmentsWithMarks.push({ maxMarks: newAssessmentMarks });
    }
    
    const assessmentCount = assessmentsWithMarks.length;
    
    // If completing all marks but less than 3 assessments exist
    if (wouldCompleteAllMarks && assessmentCount < 3) {
      return {
        isValid: false,
        message: `Cannot complete course total marks (${courseTotalMarks}) with only ${assessmentCount} assessment(s). Minimum 3 assessments required for full course coverage. Current assessments: ${assessmentCount}, Remaining marks after this: 0`
      };
    }
    
    // Additional validation: Prevent a single assessment from being > 50% of total marks when having less than 3 assessments
    const maxAllowedPerAssessment = Math.ceil(courseTotalMarks * 0.5); // 50% of total
    if (newAssessmentMarks > maxAllowedPerAssessment && assessmentCount <= 2) {
      return {
        isValid: false,
        message: `Assessment marks (${newAssessmentMarks}) exceed maximum allowed per assessment (${maxAllowedPerAssessment}) when having less than 3 assessments. Please distribute marks across at least 3 assessments.`
      };
    }
    
    return { isValid: true, message: '' };
  };

  const handleCloAllocationChange = (index, value) => {
    const newAllocations = [...cloAllocations];
    const marksValue = parseInt(value) || 0;
    newAllocations[index].marksAllocated = marksValue;
    
    // Calculate weightage for this CLO
    if (formData.maxMarks > 0) {
      newAllocations[index].weightage = Math.round((marksValue / formData.maxMarks) * 100);
    }
    
    setCloAllocations(newAllocations);
  };

  // Add function to handle threshold change
  const handleThresholdChange = (index, value) => {
    const newAllocations = [...cloAllocations];
    newAllocations[index].threshold = parseInt(value) || 50;
    setCloAllocations(newAllocations);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.mode) newErrors.mode = 'Mode is required';
    if (!formData.maxMarks || formData.maxMarks <= 0) newErrors.maxMarks = 'Max marks is required';
    if (!formData.scheduledDate) newErrors.scheduledDate = 'Scheduled date is required';
    
    // Validate CLO allocations
    const hasMarks = cloAllocations.some(clo => clo.marksAllocated > 0);
    if (!hasMarks) {
      newErrors.cloAllocations = 'Allocate marks to at least one CLO';
    }
    
    // Validate thresholds
    cloAllocations.forEach((clo, index) => {
      if (clo.marksAllocated > 0 && (clo.threshold < 0 || clo.threshold > 100)) {
        newErrors[`threshold_${index}`] = 'Threshold must be between 0 and 100%';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Run assessment distribution validation for new assessments or when max marks change
    // Only validate when this would complete all marks or when creating a new assessment
    const distributionValidation = validateAssessmentDistribution(
      parseFloat(formData.maxMarks)
    );
    
    if (!distributionValidation.isValid) {
      setAssessmentCountError(distributionValidation.message);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare assessment data WITHOUT facultyId
      const assessmentData = {
        ...formData,
        maxMarks: parseFloat(formData.maxMarks),
        weightage: parseFloat(formData.weightage),
        courseId: course.id,
        semester: course.semester,
        year: course.year,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : null,
        description: formData.description || null,
        subType: formData.subType || null
      };
      
      let assessmentId;
      let responseData;
      
      if (assessment) {
        // Update existing assessment
        await onSubmit({ ...assessmentData, id: assessment.id });
        assessmentId = assessment.id;
      } else {
        // Create new assessment
        const response = await onSubmit(assessmentData);
        console.log('Create response:', response);
        
        // Try multiple ways to get the assessment ID
        assessmentId = 
          response?.assessmentId ||
          response?.data?.id ||
          response?.data?.data?.id ||
          response?.id;
        
        responseData = response;
        
        console.log('Extracted assessment ID:', assessmentId);
        
        if (!assessmentId) {
          // If no ID, try to find the assessment by title
          alert('Assessment created but could not get ID. Please wait and refresh.');
          onClose();
          return;
        }
      }
      
      // Filter CLOs with marks and ensure valid IDs
      const validCloAllocations = cloAllocations
        .filter(clo => clo.marksAllocated > 0)
        .map(clo => {
          // Ensure cloId is a valid string (not undefined)
          const cloId = clo.cloId || 
                        clos.find(c => c.code === clo.cloCode)?.id ||
                        `clo-${Date.now()}`;
          
          return {
            cloId: cloId,
            marksAllocated: parseFloat(clo.marksAllocated),
            bloomLevel: clo.bloomLevel,
            weightage: clo.weightage,
            threshold: parseFloat(clo.threshold) || 50
          };
        })
        .filter(clo => clo.cloId && clo.cloId !== 'undefined'); // Filter out invalid
      
      // Map CLOs if we have an assessment ID and valid allocations
      if (assessmentId && validCloAllocations.length > 0) {
        try {
          console.log('Mapping CLOs with data:', {
            assessmentId,
            cloAllocations: validCloAllocations
          });
          
          await onMapClos(assessmentId, validCloAllocations);
          console.log('CLOs mapped successfully');
        } catch (cloError) {
          console.error('Error mapping CLOs:', cloError);
          console.error('CLO Error response:', cloError.response?.data);
          
          // Show specific error messages
          let errorMsg = 'Assessment saved but CLO mapping failed.';
          if (cloError.response?.data?.message) {
            errorMsg += ` Reason: ${cloError.response.data.message}`;
          } else if (cloError.message) {
            errorMsg += ` Reason: ${cloError.message}`;
          }
          
          alert(errorMsg);
        }
      } else if (!assessment && validCloAllocations.length === 0) {
        alert('Assessment created but no CLOs were allocated. Please edit to add CLOs.');
      }
      
      onClose();
      
      // Force refresh to see updated assessment with CLOs
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      console.error('Full error:', error.response?.data || error);
      
      let errorMsg = 'Failed to save assessment';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAllocated = cloAllocations.reduce((sum, clo) => sum + (clo.marksAllocated || 0), 0);
  const remaining = formData.maxMarks - totalAllocated;
  
  // Calculate course total marks and assessment count for display
  const courseTotalMarks = (course?.credits || 0) * 25;
  const otherAssessmentsTotal = existingAssessments
    .filter(a => !assessment || a.id !== assessment.id)
    .reduce((sum, a) => sum + (a.maxMarks || 0), 0);
  const totalAfterCurrent = otherAssessmentsTotal + parseFloat(formData.maxMarks || 0);
  const assessmentsCount = existingAssessments.filter(a => !assessment || a.id !== assessment.id).length + (formData.maxMarks > 0 ? 1 : 0);

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{assessment ? 'Edit Assessment' : 'Create New Assessment'}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Course Marks Summary - New section */}
            <div className="course-marks-summary" style={{
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Course Total Marks:</strong> {courseTotalMarks}
                </div>
                <div>
                  <strong>Existing Assessments:</strong> {existingAssessments.filter(a => !assessment || a.id !== assessment.id).length}
                </div>
                <div>
                  <strong>After this assessment:</strong> {assessmentsCount} assessment(s) | {totalAfterCurrent}/{courseTotalMarks} marks
                </div>
              </div>
              {assessmentCountError && (
                <div className="error-message" style={{ marginTop: '8px', padding: '8px', backgroundColor: '#ffebee' }}>
                  <AlertCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  {assessmentCountError}
                </div>
              )}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assessment Title *</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
                {errors.title && <div className="error-message">{errors.title}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Assessment Type *</label>
                <select
                  className="form-control"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                >
                  <option value="CONTINUOUS">Continuous</option>
                  <option value="MID_TERM">Mid-Term</option>
                  <option value="SEMESTER_END">Semester End</option>
                  {/* <option value="PRACTICAL">Practical</option> */}
                  <option value="OTHER">Other</option>
                </select>
                {errors.type && <div className="error-message">{errors.type}</div>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mode *</label>
                <select
                  className="form-control"
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                >
                  <option value="WRITTEN">Written</option>
                  <option value="PRESENTATION">Presentation</option>
                  <option value="ASSIGNMENT">Assignment</option>
                  <option value="PROJECT">Project</option>
                  <option value="LAB">Lab</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="MCQ">MCQ</option>
                  <option value="VIVA">Viva</option>
                </select>
                {errors.mode && <div className="error-message">{errors.mode}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Max Marks *</label>
                <input
                  type="number"
                  className="form-control"
                  name="maxMarks"
                  value={formData.maxMarks}
                  onChange={handleChange}
                  min="1"
                  max={marksRemaining + (assessment?.maxMarks || 0)}
                  required
                  disabled={isSubmitting}
                />
                {maxMarksError && <div className="error-message">{maxMarksError}</div>}
                {errors.maxMarks && <div className="error-message">{errors.maxMarks}</div>}
              </div>
            </div>
            
            <div className="form-row">
              {/* <div className="form-group">
                <label className="form-label">Weightage (%)</label>
                <input
                  type="number"
                  className="form-control"
                  name="weightage"
                  value={formData.weightage}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  readOnly
                  disabled={isSubmitting}
                />
                <small className="form-text">
                  Auto-calculated: {formData.weightage}% of course marks
                </small>
              </div> */}
              
              <div className="form-group">
                <label className="form-label">Scheduled Date *</label>
                <input
                  type="date"
                  className="form-control"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
                {errors.scheduledDate && <div className="error-message">{errors.scheduledDate}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  disabled={isSubmitting}
                  placeholder="Optional assessment description"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Sub-Type</label>
                <input
                  type="text"
                  className="form-control"
                  name="subType"
                  value={formData.subType}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="e.g., Quiz 1, Assignment 2"
                />
              </div>
            </div>
            
            <div className="clo-allocation-section">
              <h4>
                <Award size={18} /> CLO Allocation
                <small className="subtitle">Allocate marks to CLOs tested in this assessment</small>
              </h4>
              
              <div className="clo-allocation-table">
                <table>
                  <thead>
                    <tr>
                      <th>CLO Code</th>
                      <th>Statement</th>
                      <th>Bloom Level</th>
                      <th>Marks Allocated</th>
                      <th>Threshold (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cloAllocations.map((clo, index) => (
                      <tr key={clo.cloId}>
                        <td><strong>{clo.cloCode}</strong></td>
                        <td>{clos.find(c => c.id === clo.cloId)?.statement}</td>
                        <td>
                          <span className={`bloom-level ${clo.bloomLevel?.toLowerCase()}`}>
                            {clo.bloomLevel}
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={clo.marksAllocated}
                            onChange={(e) => handleCloAllocationChange(index, e.target.value)}
                            min="0"
                            max={formData.maxMarks}
                            style={{ width: '100px' }}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={clo.threshold}
                            onChange={(e) => handleThresholdChange(index, e.target.value)}
                            min="0"
                            max="100"
                            style={{ width: '80px' }}
                            disabled={isSubmitting}
                          />
                          {errors[`threshold_${index}`] && (
                            <div className="error-message small">{errors[`threshold_${index}`]}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="marks-summary">
                <p>
                  Total Allocated Marks: <strong>{totalAllocated}</strong> / {formData.maxMarks}
                </p>
                <p className="marks-total">
                  Remaining to allocate: <strong>{remaining}</strong> marks
                </p>
                {errors.cloAllocations && (
                  <div className="error-message">{errors.cloAllocations}</div>
                )}
                <div className="clo-summary-info">
                  <small>
                    <AlertCircle size={12} /> {cloAllocations.filter(clo => clo.marksAllocated > 0).length} CLOs with marks allocated
                  </small>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    {assessment ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  assessment ? 'Update Assessment' : 'Create Assessment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal; 