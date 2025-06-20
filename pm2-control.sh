#!/bin/bash

# PM2 Control Script for bsc-monitor-front

# The name of the app in your ecosystem.config.js file
APP_NAME="bsc-monitor-front"
ECOSYSTEM_FILE="ecosystem.config.cjs"

# Check if an argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 {start|stop|restart|status|logs}"
    exit 1
fi

# Function to check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null
    then
        echo "PM2 could not be found. Please install it globally: npm install -g pm2"
        exit 1
    fi
}

# Main logic
case "$1" in
    start)
        check_pm2
        # Check if the app is already running and delete it for a clean start
        pm2 describe $APP_NAME > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "Application '$APP_NAME' already exists. Stopping and deleting it first..."
            pm2 stop $APP_NAME
            pm2 delete $APP_NAME
        fi
        echo "Starting $APP_NAME with PM2..."
        pm2 start $ECOSYSTEM_FILE
        ;;
    stop)
        check_pm2
        echo "Stopping $APP_NAME..."
        pm2 stop $APP_NAME
        ;;
    restart)
        check_pm2
        echo "Restarting $APP_NAME..."
        pm2 restart $APP_NAME
        ;;
    status)
        check_pm2
        echo "Status for $APP_NAME:"
        pm2 status $APP_NAME
        ;;
    logs)
        check_pm2
        echo "Displaying logs for $APP_NAME..."
        pm2 logs $APP_NAME
        ;;
    *)
        echo "Invalid command: $1"
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac

exit 0 