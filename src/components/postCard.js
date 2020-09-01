import React, { useEffect, useState } from 'react';

// import styles
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

// import components
import Loading from "./loading"
import TransitionModal from "./postModal"

// import material UI
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { red, blue, grey, pink, maroon } from '@material-ui/core/colors';
import FavoriteIcon from '@material-ui/icons/Favorite';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import FlagSharpIcon from '@material-ui/icons/FlagSharp';
import EditIcon from '@material-ui/icons/Edit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import TwitterIcon from '@material-ui/icons/Twitter';

// other imports
import DateTimeFormat from 'dateformat';
import {TwitterShareButton} from 'react-share';

// import GQL
import { useQuery, useMutation } from "@apollo/react-hooks";
import { DELETE_POST, APPROVE_POST, LIKE_POST, UNLIKE_POST, FLAG_POST, UNFLAG_POST, EDIT_POST} from "../gql/queryData"

// import auth0
import { useAuth0 } from '@auth0/auth0-react';

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: 345,
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  share: {
    marginLeft: '50%',
  },
  likeCount:{
    fontSize: 'large',
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  avatar: {
    backgroundColor: red[500],
  },
}));

export default function PostCard({author, text, isApproved, flagCount, postID, likes, time,tags, flags, img, allTags, updateCache}) {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(false);
  const { isLoading, user } = useAuth0()
  const [liked, setLiked] = React.useState(false);
  const [flagged,setFlagged] = React.useState(false);
  const [numlikes,setnumlikes] = React.useState(0);
  const [postText, setPostText] = React.useState(text)
  const [postTags, setPostTags] = React.useState(null)
  const [open, setOpen] = React.useState(false);

  const [editText, setText] = useState(text)
  const [editTags, setTags] = useState(null)

  const [deletePost] = useMutation(DELETE_POST, {update:updateCache});
  const [approvePost] = useMutation(APPROVE_POST, {update:updateCache});
  const [likePost] = useMutation(LIKE_POST);
  const [unlikePost] = useMutation(UNLIKE_POST);
  const [flagPost] = useMutation(FLAG_POST);
  const [unflagPost] = useMutation(UNFLAG_POST);
  const [editPost] = useMutation(EDIT_POST);

  var i;
  var flagList=[];
  for (i = 0; i < flags.length;i++) {
    flagList.push({username: flags[i]["username"]})
  }
 
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleLike = () => {
    if(!user) {
      alert("Login to like the post")
      return
    }
    if (liked) {
      console.log("Unliking post...", postID)
      unlikePost({
        variables: {
          input:postID,
          likes: [{ username: user.email }]
        }
      })
      setLiked(false)
      setnumlikes(numlikes-1)
    } else{
      console.log("Liking post...", postID)
      likePost({
        variables: {
          input:postID,
          likes: [{ username: user.email }]
        }
      })
      setLiked(true)
      setnumlikes(numlikes+1)
    }
  }
  
  const handleFlag = () => {
    if(!user) {
      alert("Login to Flag the post")
      return
    }
    if (flagged){
      console.log("Unflagging post...", postID)
      unflagPost({
        variables: {
          input: postID,
          flags: [{ username: user.email }],
          flagCnt: flagCount-1
        }
      })
      setFlagged(false)
    }else{
      console.log("flagging post...", postID)
      flagPost({
        variables: {
          input: postID,
          flags: [{ username: user.email }],
          flagCnt: flagCount+1
        }
      })
      setFlagged(true)
    }
  }

  const handleApprove = () => {
    console.log("Approving post...", postText, author)
    approvePost({
      variables: {
        input: postID,
        flagArray: flagList
      }
    })
  }

  const handleReject = () => {
    console.log("Rejecting post...", postText, author)
    const delPost = {
      id : [postID]
    };
    deletePost({
      variables: {
        input: delPost
      }
    })
  }

  const handleEdit = async (newText, newTags) => {
    console.log("editing post...", postID, newTags, postTags)
    var removeTags = postTags.filter(x => !newTags.includes(x));
    var addTags = newTags.filter(x => !postTags.includes(x));

    var ptags = []
    removeTags.forEach(element => {
      ptags.push({"name": element})
    });
    var ntags = []
    addTags.forEach(element => {
      ntags.push({"name": element})
    });
    await editPost({
      variables: {
        input: postID,
        ptags: ptags,
        ntags: ntags,
        text:  newText
      }
    })
    setPostText(newText)
    setPostTags(newTags)
  }

  // set likes
  useEffect(() => {
    if(!likes)
      return
    likes.forEach( (item) => {
      if(item["username"] === user.email){
        setLiked(true)
      }    
    })
    setnumlikes(likes.length)
  },[user])

  // set flags
  useEffect(() => {
    if(!flags)
      return
    flags.forEach( (item) => {
      if(item["username"] === user.email){
        setFlagged(true)
      }    
    })
  },[user])

  // set Tags
  useEffect( () => {
    var formatted_tags = []
    tags.forEach(element => {
      formatted_tags.push(element["name"])
    });
    setPostTags(formatted_tags)
    setTags(formatted_tags)
  }, [])

  if(isLoading) {
    return <Loading />
  }

  if(img != null)
    console.log("url:", img)

  return (
    <Card className={classes.root}>
      <CardMedia
        className={classes.media}
        image={img}
      />
      <CardContent>
        
      </CardContent>
      <CardActions disableSpacing>
        {
          isApproved ?
          <>
          <Typography variant="button" style={{ color: liked?pink[200]:grey[500] }} className={classes.likeCount} color="primary" component="p">
          {numlikes}
          </Typography>
          <IconButton aria-label="add to favorites" style={{ color: liked?pink[200]:grey[500] }} value="check" onClick={handleLike} selected={liked}>
            <FavoriteIcon  fontSize="small"/>
          </IconButton>
          <IconButton aria-label="flag" value="check" style={{ color: flagged?red[500]:grey[500] }} onClick={handleFlag} selected={flagged}>
          <FlagSharpIcon fontSize="small"/>
          </IconButton>
          <TwitterShareButton className={classes.share} style={{ color: blue[500] }} url={window.location.href} title="Check this out"  >
            <TwitterIcon fontSize="small"/>
          </TwitterShareButton>
          </> : 
          <>
          <IconButton aria-label="approve" onClick={handleApprove}>
            <CheckCircleIcon htmlColor="green"/>
          </IconButton>
          <IconButton aria-label="reject" onClick={handleReject}>
            <CancelIcon htmlColor="red"/>
          </IconButton>
          <IconButton aria-label="edit" onClick={() => {setOpen(true)}}>
            <EditIcon htmlColor="blue"/>
          </IconButton>
            <TransitionModal open={open} setOpen={setOpen} text={editText} setText={setText} tags={editTags} setTags={setTags} postText={postText} setPostText={setPostText} postTags={postTags} setPostTags={setPostTags} allTags={allTags} handleEdit={handleEdit}/>
          </>
        }
        <IconButton
          className={clsx(classes.expand, {
            [classes.expandOpen]: expanded,
          })}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </IconButton>
      
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
      <CardHeader
        avatar={
          <Avatar aria-label="recipe" className={classes.avatar}>
             {author[0].toUpperCase()}
          </Avatar>
        }
        title={author}
        subheader={DateTimeFormat(time, "mmm dS, yyyy ,h:MM TT")}
      />
      <Typography variant="body2" color="textSecondary" backcomponent="p">
          {postText}
        </Typography>
      <TagList tags={postTags} />
      </Collapse>
    </Card>
  );
}

function TagList({tags}) {
  return ( <div>
    {tags.map( tag => 
      <Box component="div" display="inline" p={1} m={1} bgcolor="yellow">
      {tag}
    </Box>
    )}
    </div>
  )
}