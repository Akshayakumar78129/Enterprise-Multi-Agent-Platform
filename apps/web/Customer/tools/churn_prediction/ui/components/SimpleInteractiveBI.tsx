import React, { useState } from 'react';

interface SimpleInteractiveBIProps {
  onClose?: () => void;
}

export default function SimpleInteractiveBI({ onClose }: SimpleInteractiveBIProps = {}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  
  const questions = [
    {
      question: "How concerned are you about 22 high-risk customers?",
      options: ["Very Concerned 🚨", "Moderately ⚠️", "Slightly 📊", "Not Concerned ✅"]
    },
    {
      question: "What retention strategy do you prefer?",
      options: ["Discounts 🎯", "Personal Calls 📞", "Loyalty Rewards 🏆", "Product Improvements 🚀"]
    },
    {
      question: "What's your budget for retention?",
      options: ["₹1L+ 💎", "₹50K-1L 💼", "₹25-50K 📊", "<₹25K 🔍"]
    },
    {
      question: "When do you need results?",
      options: ["This Week 🚨", "This Month 📅", "This Quarter 📊", "Flexible 🎯"]
    },
    {
      question: "What worries you most?",
      options: ["Revenue Loss 💸", "Brand Damage 😰", "Competition 🏃", "Growth Impact 📉"]
    }
  ];

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '450px',
      maxHeight: '600px',
      background: 'linear-gradient(135deg, #1a1f2e, #2a3142)',
      borderRadius: '20px',
      border: '2px solid #3b82f6',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
      overflow: 'hidden',
      zIndex: 1200
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        borderBottom: '2px solid rgba(255,255,255,0.1)',
        position: 'relative'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🧠 AI Business Advisor
          <span style={{ 
            marginLeft: 'auto',
            fontSize: '14px',
            opacity: 0.9,
            marginRight: '30px'
          }}>
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '4px',
        background: 'rgba(255,255,255,0.1)'
      }}>
        <div style={{
          height: '100%',
          width: `${((currentQuestion + 1) / questions.length) * 100}%`,
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Content */}
      <div style={{ padding: '30px' }}>
        {currentQuestion < questions.length ? (
          <>
            {/* Question */}
            <div style={{
              fontSize: '18px',
              color: 'white',
              marginBottom: '30px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {questions[currentQuestion].question}
            </div>

            {/* Options */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px'
            }}>
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  style={{
                    padding: '15px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontWeight: '500'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Previous Answers */}
            {answers.length > 0 && (
              <div style={{
                marginTop: '30px',
                padding: '15px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '10px'
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#94a3b8',
                  marginBottom: '10px'
                }}>
                  Your answers so far:
                </div>
                {answers.map((answer, index) => (
                  <div key={index} style={{
                    fontSize: '13px',
                    color: '#3b82f6',
                    marginBottom: '5px'
                  }}>
                    Q{index + 1}: {answer}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Results */
          <div style={{
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{
              fontSize: '24px',
              marginBottom: '20px',
              color: '#10b981'
            }}>
              ✅ Analysis Complete!
            </div>
            
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '15px', fontWeight: 'bold' }}>
                Your Personalized Strategy:
              </div>
              
              <div style={{ fontSize: '14px', textAlign: 'left', lineHeight: '1.8' }}>
                Based on your answers:<br/>
                • Risk Level: {answers[0]}<br/>
                • Strategy: {answers[1]}<br/>
                • Budget: {answers[2]}<br/>
                • Timeline: {answers[3]}<br/>
                • Main Concern: {answers[4]}<br/>
                <br/>
                <strong>Recommended Action:</strong><br/>
                Implement targeted retention campaign with focus on {answers[1].toLowerCase()} 
                within {answers[3].toLowerCase()}.
              </div>
            </div>

            <button
              onClick={resetQuiz}
              style={{
                padding: '12px 30px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}