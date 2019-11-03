import React from 'react';
import ReactDOM from 'react-dom';
import { Stage, Layer, Circle, Image, Text, Label, Tag, Rect} from 'react-konva';
import _ from "lodash";

export default function aeroplane_init(root, channel) {
  ReactDOM.render(<Aeroplane channel={channel} />, root);
}

// w&h: width and height of canvas
// r: radius of pieces
let W = 2000;
let H = 1200;
let R = 20;
let buttons_clickable = true;
let last_player = "yellow";

class Aeroplane extends React.Component {
  constructor(props) {
    super(props);

    this.channel = props.channel;
    this.state = {
      // a list of pieces locations with order: yellow, blue, red, green
      pieces_loc: [],
      die: 0,
      curr_player: "",

      // multiplayer attributes
      game_active: 0,
      can_start: 0,
      user_name: "",
      user_map: {},

      // chatting room attributes
      message: [],

      // winner
      winner: "",

    };

    this.channel
        .join()
        .receive("ok", this.got_view.bind(this))
        .receive("error", resp => { console.log("Unable to join", resp); });

    this.channel.on("update", this.got_view.bind(this));
  }
  

  got_view(view) {
    this.setState(view.game);
  }

  got_view_die(view) {
    buttons_clickable = false;
    this.setState({
      pieces_loc: view.game.pieces_loc,
      die: view.game.die,
      curr_player: last_player,

      game_active: view.game.game_active,
      can_start: view.game.can_start,
      user_name: view.game.user_name,
      winner: view.game.winner,
      user_map: view.game.user_map,
    });
    
    setTimeout(
      function() {
        this.setState({
              curr_player: view.game.curr_player,
        });
        buttons_clickable = true;
      }.bind(this), 800);
  }

  on_click_die() {
    last_player = this.state.curr_player;
    if (buttons_clickable) {
      this.channel.push("on_click_die", {})
                .receive("ok", this.got_view_die.bind(this));
    }
  }

  on_click_piece(ii) {
    let piece_clickable = false;
    let player = this.state.curr_player;
    if (ii < 4 && player == "yellow") {
      piece_clickable = true;
    }
    else if ((ii >= 4 && ii < 8) && player == "blue") {
      piece_clickable = true;
    }
    else if ((ii >= 8 && ii < 12) && player == "red") {
      piece_clickable = true;
    }
    else if (ii >= 12 && player == "green") {
      piece_clickable = true;
    }

    if (buttons_clickable && piece_clickable) {
      this.channel.push("on_click_piece", { index: ii })
                .receive("ok", this.got_view.bind(this));
    }
  }

  on_click_join() {
    this.channel.push("on_click_join", {})
                .receive("ok", this.got_view.bind(this));
  }

  on_click_start() {
    // console.log("client click start");
    this.channel.push("on_click_start", {})
                .receive("ok", this.got_view.bind(this));
  }

  on_click_restart() {
    // console.log("client click restart");
    this.channel.push("on_click_restart", {})
                .receive("ok", this.got_view.bind(this));
  }

  submit() {
    let input = document.getElementById("input_message").value;
    this.channel.push("message_submit", {msg: input})
                .receive("ok", this.got_view.bind(this));
    document.getElementById("input_message").value = "";
    
  }

  display_messages() {
    let i = this.state.message.length;
    let msgs = "";
    for (i = i - 1; i >= 0; i --) {
      msgs = msgs + this.state.message[i] + "\n";
    }
    return <textarea readOnly value={msgs}/>;
  }

  playertag() {
    let keys = _.map(this.state.user_map, (ii, name) => {
      switch (ii) {
        case 0:
          return (<Text key={ii} text={"user: " + name} fontSize={20} fontFamily={"Comic Sans MS"} padding={10} x={185} y={110} />);
        case 1:
          return (<Text key={ii} text={"user: " + name} fontSize={20} fontFamily={"Comic Sans MS"} padding={10} x={725} y={110} />);
        case 2:
          return (<Text key={ii} text={"user: " + name} fontSize={20} fontFamily={"Comic Sans MS"} padding={10} x={725} y={870} />);
        case 3:
          return (<Text key={ii} text={"user: " + name} fontSize={20} fontFamily={"Comic Sans MS"} padding={10} x={185} y={870} />);
        default:
          return (<Text key={ii} text={"game status error"} fontSize={20} fontFamily={"Comic Sans MS"} padding={10} x={10} y={10} />);
      }
    });
    return keys;
  }

  render() {
    // pieces
    let pieces = _.map(this.state.pieces_loc, (pp, ii) => {
      if (ii < 4) {
        return <Circle key={ii} radius={R} x={pp.x} y={pp.y} fill={"orange"} stroke={"black"} strokeWidth={3.5} onClick={this.on_click_piece.bind(this, ii)}/>;
      }
      if (ii >= 4 && ii < 8) {
        return <Circle key={ii} radius={R} x={pp.x} y={pp.y} fill={"#0000FF"} stroke={"black"} strokeWidth={3.5} onClick={this.on_click_piece.bind(this, ii)}/>;
      }
      if (ii >= 8 && ii < 12) {
        return <Circle key={ii} radius={R} x={pp.x} y={pp.y} fill={"#FF0033"} stroke={"black"} strokeWidth={3.5} onClick={this.on_click_piece.bind(this, ii)}/>;
      }
      if (ii >= 12) {
        return <Circle key={ii} radius={R} x={pp.x} y={pp.y} fill={"#006633"} stroke={"black"} strokeWidth={3.5} onClick={this.on_click_piece.bind(this, ii)}/>;
      } 
    });
      

    return(
        <div className="background">
          <Stage width={W} height={H}>
            <Layer>
              {/* clickable components */}
              <Die number={this.state.die} player={this.state.curr_player} on_click_die={this.on_click_die.bind(this)}/>
              {pieces}

              {/* game state messages */}
              <Signal player={this.state.curr_player} />
              {this.playertag()}
              <Winner winner={this.state.winner} />
              <Rect fill={"#cce5ff"} x={1020} y={0} width={350} height={900}/>
            </Layer>
            
          </Stage>

          {/* chatting room */}
          <div className="chat_messages">
            <p className="discuss_area">Chatting Room</p>
            <div>{this.display_messages()}</div>
            <input className="input_box" type="text" id="input_message"/>
            <button className="send_button" onClick={this.submit.bind(this)}>Send</button>
          </div>

          {/* game buttons */}
          <div className="functional_buttons">
            <JoinButton game_active={this.state.game_active} on_click_join={this.on_click_join.bind(this)}/>
            <StartButton can_start={this.state.can_start} on_click_start={this.on_click_start.bind(this)}/>
            <RestartButton winner={this.state.winner} on_click_restart={this.on_click_restart.bind(this)}/>
          </div>
        </div>
    );
  }
}

function Die(params) {
  let {number, player, on_click_die} = params;
  let img = new window.Image();
  // let img = new Image();
  let img_path = "/images/" + number.toString() + ".png";
  
  img.onload = () => {
    console.log("number on the die: " + number.toString());
  }
  img.src = img_path;

  if (player == "yellow") {
    return <Image image={img} width={100} height={100} x={25} y={200}  onClick={on_click_die}/>
  }
  else if (player == "blue") {
    return <Image image={img} width={100} height={100} x={880} y={200}  onClick={on_click_die}/>
  }
  else if (player == "red") {
    return <Image image={img} width={100} height={100} x={880} y={725}  onClick={on_click_die}/>
  }
  else {
    return <Image image={img} width={100} height={100} x={25} y={725}  onClick={on_click_die}/>
  }
  
}

function Signal(params) {
  let {player} = params;
  return <Text class="signal" fontSize={30} fontFamily={"Comic Sans MS"} text={"current player: " + player} x={380} y={70} />
}

function JoinButton(params) {
  let {game_active, on_click_join} = params;
  if (game_active == 0) {
    return <p><button className="game_button" onClick={on_click_join}>Join Game</button></p>;
  }
  return <div></div>;
}

function StartButton(params) {
  let {can_start, on_click_start} = params;

  if(can_start == 1) {
    return <p><button className="game_button" onClick={on_click_start}>Start</button></p>;
  }
  return <div></div>;
}

function RestartButton(params) {
  let {winner, on_click_restart} = params;

  if(winner == "") {
    return <div></div>;
  }
  else {
    return <p><button className="game_button" onClick={on_click_restart}>Restart</button></p>;
  }
}

function Winner(params) {
  let {winner} = params;
  if (winner == "") {
    // return <Text class="signal" text={"wins!"} fontSize={30} fontFamily={"Comic Sans MS"} padding={10} x={380} y={20} />
    return <Text text={""} x={380} y={20} />
  }
  else {
    return <Text class="signal" text={winner + " wins!"} fontSize={30} fontFamily={"Comic Sans MS"} padding={10} x={380} y={20} />
  }
}