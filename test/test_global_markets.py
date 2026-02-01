#!/usr/bin/env python3
"""
测试Aktools对全球市场的支持情况
"""

import requests
import json

def test_global_markets():
    base_url = "http://localhost:8080"
    
    print("🌍 测试Aktools全球市场支持...")
    
    # 测试港股接口
    hk_interfaces = [
        "stock_hk_spot_em",
        "stock_hk_hist",
        "stock_hk_spot"
    ]
    
    print("\n📈 测试港股接口:")
    for interface in hk_interfaces:
        try:
            response = requests.get(f"{base_url}/api/public/{interface}")
            print(f"   {interface}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    print(f"     数据条数: {len(data)}")
        except Exception as e:
            print(f"   {interface}: 错误 - {e}")
    
    # 测试美股接口
    us_interfaces = [
        "stock_us_spot_em",
        "stock_us_hist",
        "stock_us_spot"
    ]
    
    print("\n🇺🇸 测试美股接口:")
    for interface in us_interfaces:
        try:
            response = requests.get(f"{base_url}/api/public/{interface}")
            print(f"   {interface}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    print(f"     数据条数: {len(data)}")
        except Exception as e:
            print(f"   {interface}: 错误 - {e}")
    
    # 测试具体港股数据
    print("\n🔍 测试具体港股数据:")
    hk_symbols = ["00700", "00941", "01299"]  # 腾讯、中移动、友邦保险
    for symbol in hk_symbols:
        try:
            response = requests.get(f"{base_url}/api/public/stock_hk_spot_em?symbol={symbol}")
            print(f"   港股 {symbol}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"     数据: {data}")
        except Exception as e:
            print(f"   港股 {symbol}: 错误 - {e}")
    
    # 测试具体美股数据
    print("\n🔍 测试具体美股数据:")
    us_symbols = ["AAPL", "MSFT", "GOOGL"]
    for symbol in us_symbols:
        try:
            response = requests.get(f"{base_url}/api/public/stock_us_spot_em?symbol={symbol}")
            print(f"   美股 {symbol}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"     数据: {data}")
        except Exception as e:
            print(f"   美股 {symbol}: 错误 - {e}")

if __name__ == "__main__":
    test_global_markets()