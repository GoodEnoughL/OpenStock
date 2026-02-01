#!/usr/bin/env python3
"""
测试Aktools股票数据API
"""

import requests
import json

def test_stock_data_api():
    base_url = "http://localhost:8080"
    
    print("📊 测试Aktools股票数据API...")
    
    # 测试A股实时数据
    try:
        response = requests.get(f"{base_url}/api/public/stock_zh_a_spot_em")
        print(f"✅ A股实时数据接口状态: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   数据类型: {type(data)}")
            if isinstance(data, list):
                print(f"   数据条数: {len(data)}")
                if len(data) > 0:
                    print("   第一条数据的字段:")
                    first_item = data[0]
                    for key, value in first_item.items():
                        print(f"     {key}: {value}")
            else:
                print(f"   数据内容: {data}")
        else:
            print(f"   错误信息: {response.text}")
    except Exception as e:
        print(f"❌ A股实时数据接口测试失败: {e}")
    
    # 测试公司信息接口
    try:
        response = requests.get(f"{base_url}/api/public/stock_individual_info_em?symbol=000001")
        print(f"✅ 公司信息接口状态: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   数据类型: {type(data)}")
            if isinstance(data, dict):
                print("   字段列表:")
                for key, value in data.items():
                    print(f"     {key}: {value}")
            else:
                print(f"   数据内容: {data}")
        else:
            print(f"   错误信息: {response.text}")
    except Exception as e:
        print(f"❌ 公司信息接口测试失败: {e}")

if __name__ == "__main__":
    test_stock_data_api()