#!/usr/bin/env python3
"""
测试Aktools API具体功能
"""

import requests
import json

def test_aktools_api():
    base_url = "http://localhost:8080"
    
    print("🧪 测试Aktools API具体功能...")
    
    # 测试版本信息
    try:
        response = requests.get(f"{base_url}/version")
        print(f"✅ 版本信息: {response.status_code}")
        if response.status_code == 200:
            print(f"   版本: {response.text}")
    except Exception as e:
        print(f"❌ 版本信息失败: {e}")
    
    # 测试API展示
    try:
        response = requests.get(f"{base_url}/api/show")
        print(f"✅ API展示: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   可用接口数量: {len(data) if isinstance(data, list) else 'N/A'}")
            if isinstance(data, list) and len(data) > 0:
                print("   前5个接口:")
                for i, item in enumerate(data[:5]):
                    print(f"     {i+1}. {item}")
    except Exception as e:
        print(f"❌ API展示失败: {e}")
    
    # 测试具体接口
    interfaces = [
        "stock_zh_a_spot_em",
        "stock_info_a_code_name",
        "stock_zh_index_spot"
    ]
    
    for interface in interfaces:
        try:
            response = requests.get(f"{base_url}/api/show-temp/{interface}")
            print(f"✅ {interface} 接口测试: {response.status_code}")
            if response.status_code == 200:
                print(f"   接口可用")
        except Exception as e:
            print(f"❌ {interface} 接口测试失败: {e}")

if __name__ == "__main__":
    test_aktools_api()