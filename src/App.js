import React from 'react';

import socket from "./socket"
// import { v4 as uuidv4 } from 'uuid';
import Picker from 'emoji-picker-react';

import './App.css';
import { MDBProgress, MDBBtn, MDBContainer, MDBInput, MDBRow, MDBAlert } from 'mdbreact';
import moment from 'moment';


function App() {
  const [messages, setMessages] = React.useState([]);
  const [rooms, setRooms] = React.useState([]);
  const [currentRoom, setCurrentRoom] = React.useState(null);
  const [user, setUser] = React.useState()
  const [yesCount, setYesCount] = React.useState(0);
  const [maybeCount, setMaybeCount] = React.useState(0);
  const [noCount, setNoCount] = React.useState(0);
  const [total, setTotal] = React.useState(0)
  const [chosenEmoji, setChosenEmoji] = React.useState({ emoji: "" });
  const [chatInput, setChatInput] = React.useState("")

  const messagesRef = React.useRef(messages)  //dub nghia la them value moi, vo array cu voi dk khong rerender(cho khac voi usestate)


  React.useEffect(() => {
    socket.on("connection")
    console.log("join 1")
    return () => {
      console.log("pre dis")

      socket.disconnect();
      console.log("discted")

    };

  }, []);
  React.useEffect(() => {
    askForName()
  }, [])

  React.useEffect(() => {
    socket.on("rooms", function (data) {
      // data= rooms from backend
      if (data && Array.isArray(data)) {
        setRooms(data)
      }
    })
  }, [rooms])

  const askForName = () => {
    const name = prompt("What is your name");
    if (name) {
      socket.emit("login", name, res => {
        console.log("response from backend", res)
        setUser(res)
      })
    } else {
      askForName()
    }
  }

  //khuc nay de hien thi msg su dung useeffect khac cho ro
  //dub.current will be lated value, check cach su dung useref(the best)/ use memo /usecallback
  //setEmj icon to send to backend
  React.useEffect(() => {
    socket.on("messages", function (chat) {
      console.log(chat)
      console.log(messagesRef)
      messagesRef.current = [chat, ...messagesRef.current]
      setMessages(messagesRef.current)
    })
  }, []);


  //them 1 useeffect nua de lay user name
  // React.useEffect(() => {

  //   const name = prompt("what s ur name");
  //   setUser(name)

  // }, [])

  React.useEffect(() => {
    socket.on("receiveVote", (option) => {
      setTotal(total + 1);
      if (option === "yes") {
        setYesCount(yesCount + 1);
      }
      if (option === "maybe") {
        setMaybeCount(maybeCount + 1);
      }
      if (option === "no") {
        setNoCount(noCount + 1);
      }
    });
    return () => socket.off("receiveVote");
  }, [total, yesCount, maybeCount, noCount]);


  const handleChatSubmit = (e) => {
    e.preventDefault();
    const message = e.target.chat.value
    socket.emit("sendMessage", message)
    const form = document.getElementById("chatform");
    form.reset();
  }

  const sendVote = (option) => {
    socket.emit("vote", option);
  };

  const onEmojiClick = (event, emojiObject) => {
    console.log("check emoji", emojiObject)
    setChatInput(chatInput + " " + emojiObject.emoji);

  }
  // const setEmj = (chosenEmoji) => {
  //   return chosenEmoji
  // }

  const renderMessages = (m) => {
    const messages = m.slice();
    for (let index = 1; index < messages.length; index++)
      messages[index].showTime = (
        messages[index] && messages[index].user
        && messages[index - 1] && messages[index - 1].user
        && messages[index].user._id !== messages[index - 1].user._id);

    return messages.map(e => <Message key={e.id} obj={e} user={user} />)
  }
  console.log("check msg", messages)
  console.log("eji value in app", chosenEmoji)
  return (
    <div className="mainPage">
      <div className="tien-chat-room">
        <Rooms
          rooms={rooms}
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          setMessages={setMessages}
          messagesRef={messagesRef} />
      </div>

      <MDBContainer>

        <h5 > How is this chat room?</h5>

        <div className="tien-poll">
          <div className="tien-poll-part">
            <MDBProgress
              height={5}
              animated
              key={1}
              color="default"
              value={(yesCount * 100) / total}
            />
            <MDBProgress
              height={5}
              animated
              key={2}
              color="warning"
              value={(maybeCount * 100) / total}
            />
            <MDBProgress
              height={5}
              animated
              key={3}
              color="danger"
              value={(noCount * 100) / total}
            />
          </div>
          <div className="tien-poll-part-bot">
            <p>Wellcome<span><MDBBtn color="unique-color" className="tien-welcome"> {user ? `${user.name}` : ""}</MDBBtn></span></p>
            <div style={{ marginTop: "20px" }}>
              <MDBBtn style={{ borderRadius: "30px", padding: "0px" }} onClick={(e) => sendVote("yes")}>
                Polite
        </MDBBtn>
              <MDBBtn style={{ borderRadius: "30px", padding: "0px" }} color="warning" onClick={(e) => sendVote("maybe")}>
                Respectful
        </MDBBtn>
              <MDBBtn style={{ borderRadius: "30px", padding: "0px" }} color="danger" onClick={(e) => sendVote("no")}>
                Unsociable
      </MDBBtn>
            </div>
          </div>
        </div>
        {/* CHAT PART */}
        <div className="tien-commu">
          {renderMessages(messages, chosenEmoji)}

        </div>
        <form onSubmit={handleChatSubmit} id="chatform" className="tien-chat-part">
          <MDBInput
            name="chat"
            label="talk to your friends"
            className="tien-input"
            value={chatInput}
            onChange={(e) => { console.log(e); setChatInput(e.target.value) }}
          />


          <span >{chosenEmoji && <EmojiData chosenEmoji={chosenEmoji} />}</span>


          <Picker
            onEmojiClick={onEmojiClick}
            disableSearchBar={true}
            preload={false}
          />

          <MDBBtn style={{ borderRadius: "30px", padding: "0px", marginTop: "20px" }} type="submit" color="teal darken-3">Send</MDBBtn>
        </form>
      </MDBContainer>

    </div>

  );
}
const Rooms = props => props.rooms.map((e, idx) => {
  // console.log("check e:", e)
  // console.log("tien check ", props)

  return <MDBBtn
    light
    color={!props.currentRoom ? "teal lighten-4" : (e._id === props.currentRoom._id ? "teal darken-3" : "")}
    className="text-center"
    style={{ borderRadius: "30px", padding: "0px" }}
    className={!props.currentRoom ? "" : (e._id === props.currentRoom._id ? "bold" : "")}
    onClick={async () => {
      if (props.currentRoom) {

        socket.emit("leaveRoom", props.currentRoom._id);
      }
      await socket.emit(
        "joinRoom",
        e._id, res => {
          if (res.status === 'ok') {
            props.setCurrentRoom(res.data.room)
            console.log(res.data.history)
            props.setMessages([...res.data.history])
            props.messagesRef.current = [...res.data.history]
          } else {
            alert("something wrong")
          }
        })
    }}> {e.room} {idx === props.rooms.length - 1 ? "" : ""} - {} </MDBBtn> //props.currentRoom.members.length
})


// const Message = props.messages.map = ({ obj, user }, idx) => {

const Message = ({ obj, user, chosenEmoji }) => {
  // console.log("check user ", user)
  // console.log("check obj", obj)
  console.log("eji in com mess", chosenEmoji)

  return <MDBRow className={obj.user.name === user.name ? "move-right" : ""} >
    <span
      className={obj.user.name === user.name ? "tien-display" : "tien-display-none"}
    >{obj.showTime ? <p className="arrange-time" ><span> {moment(obj.createdAt).format("hh : mm ")} </span></p> : null}</span>
    <p>
      <span
        className={obj.user.name === user.name ? "userOne" : "userTwo"}
        style={{ fontWeight: "bold" }}
      > {obj.user.name}</span>
      <span >{obj.chat}</span>




    </p>
    <span
      className={obj.user.name === user.name ? "tien-display-none" : "tien-display"}
    >{obj.showTime ? <p className="arrange-time"><span > {moment(obj.createdAt).format("hh : mm ")} </span></p> : null}</span>
  </MDBRow>

}

const EmojiData = ({ chosenEmoji }) => {
  console.log("eji in com ejidata:", chosenEmoji.emoji)
  return <div>
    {chosenEmoji.emoji}
  </div>
}



export default App;
