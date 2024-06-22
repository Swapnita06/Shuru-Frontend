import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import AnnouncementOutlinedIcon from '@mui/icons-material/AnnouncementOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import { TextField, Checkbox, FormControlLabel, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [open, setOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState({ name: '', description: '', goal: '' });
  const [models, setModels] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedModels, setSelectedModels] = useState([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = () => {
    axios.get('http://localhost:5000/models')
      .then(response => {
        const allModels = [...response.data.predefined_models, ...response.data.custom_models];
        setModels(allModels);
      })
      .catch(error => {
        console.error('There was an error fetching the models!', error);
      });
  };

  const handleOpen = (agent, creating = false) => {
    setCurrentAgent(agent);
    setIsCreating(creating);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentAgent((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = () => {
    axios.post('http://localhost:5000/create_model', currentAgent)
      .then(response => {
        console.log(response.data.message);
        fetchModels(); // Refresh models after creating a new one
      })
      .catch(error => {
        console.error('There was an error creating the agent!', error);
      });

    setOpen(false);
  };

  const handleChat = () => {
    if (isGroupChat) {
      if (selectedModels.length === 0) {
        alert('Please select at least one model for group chat.');
        return;
      }
      const selectedModelNames = selectedModels.join(',');
      navigate(`/group-chat/${selectedModelNames}`);
    } else {
      navigate(`/chat/${currentAgent.name}`);
    }
    setOpen(false);
  };

  const handleModelSelection = (modelName) => {
    setSelectedModels((prevSelectedModels) => {
      if (prevSelectedModels.includes(modelName)) {
        return prevSelectedModels.filter((name) => name !== modelName);
      } else if (prevSelectedModels.length < 3) {
        return [...prevSelectedModels, modelName];
      } else {
        alert('You can select up to 3 models for group chat.');
        return prevSelectedModels;
      }
    });
  };

  const getAgentIcon = (modelName) => {
    switch (modelName.toLowerCase()) {
      case 'coder':
        return <AddCircleOutlineIcon style={{ color: 'white' }} />;
      case 'product_manager':
        return <GroupAddOutlinedIcon style={{ color: 'white' }} />;
      case 'scientist':
        return <HomeOutlinedIcon style={{ color: 'white' }} />;
      case 'doctor':
        return <ChatOutlinedIcon style={{ color: 'white' }} />;
      // Add cases for other models as needed
      default:
        return null;
    }
  };

  return (
    <div className='home'>
      <div className="container">
        <div className="box1">
          <nav>
            <ul className="icon-list">
              <div className="list">
                <div className="list1" style={{ color: "gray" }}>
                  <Tooltip title="Home">
                    <li><HomeOutlinedIcon style={{ width: "40px" }} /></li>
                  </Tooltip>
                  <Tooltip title="Create New Agent">
                    <li onClick={() => handleOpen({ name: '', description: '', goal: '' }, true)}><AddCircleOutlineIcon /></li>
                  </Tooltip>
                  <Tooltip title="Group Chat">
                    <li onClick={() => setIsGroupChat(!isGroupChat)}><GroupAddOutlinedIcon /></li>
                  </Tooltip>
                  <Tooltip title={isGroupChat ? 'Start Group Chat' : 'Chat'}>
                    <li onClick={handleChat}><ChatOutlinedIcon /></li>
                  </Tooltip>
                </div>
                <div className="list2" style={{ color: "gray" }}>
                  <Tooltip title="Announcements">
                    <li><AnnouncementOutlinedIcon /></li>
                  </Tooltip>
                  <Tooltip title="Account">
                    <li><AccountCircleOutlinedIcon /></li>
                  </Tooltip>
                </div>
              </div>
            </ul>
          </nav>
        </div>

        <div className="box2" style={{ marginTop: "20px" }}>
          <h1 className="main-title" style={{ fontFamily: "Poppins", fontWeight: "400", color: "white" }}>Discover Your Perfect AI Companion</h1>
          <h3 className="sub-title" style={{ fontFamily: "Poppins", fontWeight: "400", color: "white" }}>Tailored Intelligence for every need.</h3>
          <div className="boxes" style={{ marginTop: "50px" }}>
            {models.map((model, index) => (
              <div key={index} className={`agents ${selectedModels.includes(model.name) ? 'selected' : ''}`} onClick={() => !isGroupChat && handleOpen(model)} >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedModels.includes(model.name)}
                      onChange={() => handleModelSelection(model.name)}
                      disabled={!isGroupChat && selectedModels.length > 0}
                    />
                  }
                  label={
                    <div className="agent-details" style={{marginLeft:"-30px"}}>
                      <div className="agent-icon">
                        {getAgentIcon(model.name)} {/* Function to get corresponding icon */}
                      </div>
                      <div className="agent-text" style={{marginTop:"-15px",width:"200px"}}>
                        <h3 style={{ color: 'white',fontFamily:"Montserrat",fontWeight:"300" }}>{model.name}</h3>
                        <p style={{ color: '#d0d0d0', marginTop:"-3px",fontFamily:"Montserrat",fontWeight:"150" }}>{model.description}</p>
                      </div>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-agent-title"
        aria-describedby="modal-agent-description"
      >
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 600, bgcolor: 'black', border: '1px solid white', boxShadow: 24, p: 4, borderRadius: '5%', padding:"50px"
        }}>
          <Typography variant="subtitle1" sx={{ mt: 2, color: 'white', fontFamily:"Montserrat" }}>
            Agent Name
          </Typography>
          <TextField
            fullWidth
            placeholder='Agent Name'
            name="name"
            value={currentAgent.name}
            onChange={handleChange}
            margin="normal"
            sx={{
              '& .MuiInputBase-root': {
                backgroundColor: 'black',
                color: 'white',
                borderRadius: '15px',
              },
              '& .MuiInputBase-input': {
                color: 'white',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'gray',
              },
              '& .MuiInputLabel-root': {
                color: 'white',
              },
              '& .MuiInputLabel-shrink': {
                color: 'white',
              },
              '& .Mui-disabled': {
        color: 'white',
      }
            }}
            disabled={!isCreating} // Disable input if not creating
          />

          <Typography variant="subtitle1" sx={{ mt: 2, color: 'white' , fontFamily:"Montserrat" }}>
            Agent Description
          </Typography>
          <TextField
            fullWidth
            placeholder='Agent Description'
            name="description"
            value={currentAgent.description}
            onChange={handleChange}
            margin="normal"
            sx={{
              '& .MuiInputBase-root': {
                backgroundColor: 'black',
                color: 'white',
                borderRadius: '15px',
              },
              '& .MuiInputBase-input': {
                color: 'white',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'gray',
              },
              '& .MuiInputLabel-root': {
                color: 'white',
              },
              '& .MuiInputLabel-shrink': {
                color: 'white',
              },
              '& .Mui-disabled': {
        color: 'white',
      }
            }}
            disabled={!isCreating} // Disable input if not creating
          />

          {isCreating && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, color: 'white' }}>
                Your Goal
              </Typography>
              <TextField
                fullWidth
                placeholder='Your Goal'
                name="goal"
                value={currentAgent.goal}
                onChange={handleChange}
                margin="normal"
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: 'black',
                    color: 'white',
                    borderRadius: '15px',
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'gray',
                  },
                  '& .MuiInputLabel-root': {
                    color: 'white',
                  },
                  '& .MuiInputLabel-shrink': {
                    color: 'white',
                  },
                }}
              />
            </>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={isCreating ? handleCreate : handleChat}
            >
              {isCreating ? 'Create' : 'Chat'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default Home;
