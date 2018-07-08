/**
 * React-based chat client for node-multi-server-chat
 */
import { PORTS, NO_RECIPIENT} from '../constants/Config.js';
import { clientStyle, footerStyle } from '../constants/Styles.js';
import { Socket } from '../utils/Socket.js';
import { UserInput } from './UserInput.js'
import { RecipientSelector } from './RecipientSelector.js';
import { PortSelector } from './PortSelector.js';
import { ConnectButton } from './ConnectButton.js';
import { StatusLine } from './StatusLine.js';
import { MessageTransport } from './MessageTransport.js';
import { MessageHistory } from './MessageHistory.js';

const createElement = React.createElement;

// Main client component
export class Client extends React.Component {
    constructor(props) {
        super(props);
        this.onStatusChange = this.onStatusChange.bind(this);
        this.onConnectionChange = this.onConnectionChange.bind(this);
        this.onToggleConnection = this.onToggleConnection.bind(this);
        this.onIncomingMessage = this.onIncomingMessage.bind(this);
        this.onSendMessage = this.onSendMessage.bind(this);
        this.onUserChange = this.onUserChange.bind(this);
        this.onPortChange = this.onPortChange.bind(this);
        this.onUpdateClient = this.onUpdateClient.bind(this);
        this.onRecipientChange = this.onRecipientChange.bind(this);
        this.onMessageInputChange = this.onMessageInputChange.bind(this);
        this.socket = new Socket(
            this.onConnectionChange,
            this.onStatusChange,
            this.onIncomingMessage,
            this.onUpdateClient
        );
        this.state = {
            connected: false,
            status: 'Select a user and port.',
            isError: false,
            user: null,
            recipient: NO_RECIPIENT,
            outgoingMessage: '',
            messages: [],
            port: PORTS[0],
            users: []
        };
    }

    // The status message has changed
    onStatusChange(status, isError) {
        this.setState({
            status: status,
            isError: isError
        });
    }

    // The socket's connection state changed
    onConnectionChange(isConnected) {
        this.setState({
            status: isConnected ? 'Connected' : 'Disconnected',
            connected: isConnected,
            isError: false
        });
    }

    // The client has received a message
    onIncomingMessage(message){
        message.key = this.state.messages.length;
        this.setState({
            messages: this.state.messages.concat([message])
        });
    }

    // User clicked the connect/disconnect button
    onToggleConnection() {
        if (this.state.connected) {
            this.socket.disconnect();
            this.setState({
                users:[],
                recipient: NO_RECIPIENT,
                outgoingMessage: ''
            });
        } else if(this.state.port && this.state.user) {
            this.socket.connect(this.state.user, this.state.port);
        }
    }

    // User wants to send an instant message
    onSendMessage() {
        this.socket.sendIm({
            'from': this.state.user,
            'to': this.state.recipient,
            'text': this.state.outgoingMessage,
            'forwarded': false
        });
        this.setState({outgoingMessage: ''});
    }

    // A user has been selected
    onUserChange(user) {
        this.setState({user: user});
    }

    // A port has been selected
    onPortChange(port) {
        this.setState({port: port});
    }

    // The server has updated us with a list of users
    onUpdateClient(message){
        let otherUsers = message.list.filter(user => user !== this.state.user);
        this.setState({users: otherUsers});
        if (otherUsers.length) this.setState({recipient: NO_RECIPIENT});
    }

    // A recipient has been selected
    onRecipientChange(user) {
        this.setState({recipient: user});
        if (user === NO_RECIPIENT) this.setState({outgoingMessage: null});
    }

    // The outgoing message text has changed
    onMessageInputChange(text) {
        this.setState({outgoingMessage: text})
    }

    // Render the component
    render() {
        return createElement('div', {style: clientStyle},

            // User selector
            createElement(UserInput, {
                connected: this.state.connected,
                onChange: this.onUserChange
            }),

            // Port selector
            createElement(PortSelector, {
                connected: this.state.connected,
                onChange: this.onPortChange
            }),

            // Recipient selector
            createElement(RecipientSelector, {
                users: this.state.users,
                recipient: this.state.recipient,
                onChange: this.onRecipientChange
            }),

            // Outgoing message input and send button
            createElement(MessageTransport, {
                connected: this.state.connected,
                recipient: this.state.recipient,
                outgoingMessage: this.state.outgoingMessage,
                onChange: this.onMessageInputChange,
                onSend: this.onSendMessage
            }),

            // Message History
            createElement(MessageHistory, {
                user: this.state.user,
                messages: this.state.messages,
                connected: this.state.connected
            }),

            // Footer (status line / connection toggle)
            createElement('div', {style: footerStyle},

                // Status Line
                createElement(StatusLine, {
                    status: this.state.status,
                    isError: this.state.isError
                }),

                // Connect button
                createElement(ConnectButton, {
                    enabled: (this.state.port && this.state.user),
                    connected: this.state.connected,
                    handleClick: this.onToggleConnection
                })
            )
        )
    }
}