import schedule
import time
import os
import argparse
import subprocess

script_dir = os.path.dirname(os.path.abspath(__file__))

def run_server(dev_mode, skip):
    os.system("pkill -f deno")

    # First get all the transfer stops
    if not skip:
        os.system(f'python3 {script_dir}/getTransferStops.py')

    api_path = os.path.join(script_dir, '..')
    api_path = os.path.normpath(api_path)

    env_file = '.env.dev' if dev_mode else '.env.prod'
    subprocess.Popen(["deno", "--allow-all", f'--env-file={api_path}/{env_file}', f'{api_path}/api.ts'])

def main():
    dev_mode = True
    skip = False
    parser = argparse.ArgumentParser()
    parser.add_argument('--dev', required=False, help='Development mode', action='store_true')
    parser.add_argument('--prod', required=False, help='Production mode', action='store_true')
    parser.add_argument('--skip-transfer-points', required=False, help='Skip getting transfer points phase', action='store_true')
    args = parser.parse_args()
    if args.dev:
        dev_mode = True
    if args.prod:
        dev_mode = False
    if args.skip_transfer_points:
        skip = True

    run_server(dev_mode, skip)
    schedule.every().day.at("02:00").do(run_server, dev_mode, skip)
    while True:
        schedule.run_pending()
        time.sleep(30)


if __name__ == '__main__':
    main()