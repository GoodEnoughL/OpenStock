#!/usr/bin/env python3
"""
直接测试AKShare港美股接口
"""

import requests

def test_direct():
    base_url = "http://localhost:8080"
    
    # 测试港股接口
    print("测试港股接口:")
    try:
        response = requests.get(f"{base_url}/api/public/stock_hk_spot_em")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            print("港股接口可用!")
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                print(f"数据条数: {len(data)}")
                print(f"第一条数据: {data[0]}")
            else:
                print(f"数据类型: {type(data)}")
        else:
            print(f"港股接口不可用: {response.text}")
    except Exception as e:
        print(f"错误: {e}")
    
    # 测试美股接口
    print("\n测试美股接口:")
    try:
        response = requests.get(f"{base_url}/api/public/stock_us_spot_em")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            print("美股接口可用!")
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                print(f"数据条数: {len(data)}")
                print(f"第一条数据: {data[0]}")
            else:
                print(f"数据类型: {type(data)}")
        else:
            print(f"美股接口不可用: {response.text}")
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    test_direct()